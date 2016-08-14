/** @jsx html */
import xs from 'xstream'
import {html} from 'snabbdom-jsx'
import clamp from 'clamp'
import dropRepeats from 'xstream/extra/dropRepeats'
import dropUntil from 'xstream/extra/dropUntil'
import isolate from '@cycle/isolate'
import sample from 'lodash/sample'
import random from 'lodash/random'

import './main.less'
import {makeConsoleHistory} from './makeConsoleDriver'
import {slides, slideIndexBySlug} from './slides'
import * as myo from './device/myo'
import * as hrm from './device/hrm'
import * as csc from './device/csc'
import DeviceToggle from './DeviceToggle'

function intent({DOM, keydown, gesture, history}) {
  return xs.merge(
    keydown
      .filter(({key}) => key === 'ArrowLeft')
      .mapTo({type: 'changeSlide', delta: -1}),

    keydown
      .filter(({key}) => key === 'ArrowRight')
      .mapTo({type: 'changeSlide', delta: 1}),

    // hold wave-out for 1500ms to go to previous slide
    gesture
      .map(({gesture}) => gesture === 'wave-out' ? xs.periodic(1500) : xs.empty())
      .flatten()
      .mapTo({type: 'changeSlide', delta: -1}),

    gesture
      .filter(({gesture}) => gesture === 'double-tap')
      .mapTo({type: 'changeSlide', delta: 1}),

    history
      .map(loc => loc.pathname.substr(1))
      .map(slug => slideIndexBySlug(slug))
      .filter(x => x !== undefined)
      .map(idx => ({type: 'changeSlide', jumpTo: idx}))
  )
}

function model(action$, slides) {
  const slideIdx$ = action$
    .filter(({type}) => type === 'changeSlide')
    .fold((curSlide, action) => {
      const targetIdx = action.hasOwnProperty('jumpTo') ? action.jumpTo : curSlide + action.delta
      return clamp(targetIdx, 0, slides.length - 1)
    }, 0)
    .compose(dropRepeats())
    .remember()

  return slideIdx$
}

function pluckSink(key) {
  return function(sinks$) {
    return sinks$
      .map(sinks => sinks[key])
      .filter(x => x)
      .flatten()
  }
}

function makeDeviceToggle(name, shape, {DOM, bluetooth, fakeData, realData}) {
  const toggleProps$ = bluetooth.deviceConnected(name)
    .map(isConnected => ({name, isConnected}))

  const toggle = isolate(DeviceToggle, `toggle-${name}`)({
    DOM,
    props: toggleProps$
  })

  const declare$ = toggle.mode$
    .map(mode => ({
      type: 'declare',
      device: name,
      connected: mode === 'real',
      ...shape,
    }))

  const data$ = toggle.mode$
    .map(mode => mode === 'real' ? realData : fakeData)
    .flatten()
    .remember()

  // start reading data immediately / endlessly
  data$.addListener({
    next: () => {},
    error: () => {},
    complete: () => {},
  })

  return {
    ...toggle,
    bluetooth: declare$,
    data: data$,
  }
}

export default function main({ DOM, history, bluetoothConsole, streamConsole, pairwiseConsole, keydown, bluetooth }) {
  const bluetoothConsoleHistory$ = makeConsoleHistory(bluetoothConsole).remember()
  const streamConsoleHistory$ = makeConsoleHistory(streamConsole).remember()
  const pairwiseConsoleHistory$ = makeConsoleHistory(pairwiseConsole).remember()

  const gesture$ = myo.gestureStream(bluetooth, 'myo')
  const slideActionProxy$ = xs.create()
  const action$ = intent({DOM, keydown, gesture: gesture$, history})
  const slideIdx$ = model(xs.merge(action$, slideActionProxy$), slides)

  const realMyoData$ = bluetooth.characteristic('myo', myo.gestureService, myo.gestureCharacteristic)
    .map(({value}) => ({value: new DataView(value.buffer.slice(0, 3))}))  // not sure why, but we get more bytes than stated in the spec
  const myoPoses = Array.from(myo.poseMap.keys())
  const fakeMyoData$ = xs.periodic(1000)
    .map(x => {
      const d = new DataView(new ArrayBuffer(3))
      d.setUint8(0, 0x03)
      d.setUint16(1, sample(myoPoses), true)
      return {value: d}
    })

  const myoToggle = makeDeviceToggle('myo', myo.shape, {
    DOM,
    bluetooth,
    realData: realMyoData$,
    fakeData: fakeMyoData$,
  })

  const realHRMData$ = bluetooth.characteristic('hrm', 'heart_rate', 'heart_rate_measurement')
  const fakeHRMData$ = xs.periodic(1000)
    .map(x => {
      const d = new DataView(new ArrayBuffer(4))
      d.setUint8(0, 0x10)
      // heart rate
      d.setUint8(1, random(80, 200), true)
      // rrintervals
      // TODO: would better to make the rrintervals relate to the heart rate
      d.setUint16(2, random(400, 900), true)
      return {value: d}
    })

  const hrmToggle = makeDeviceToggle('hrm', hrm.shape, {
    DOM,
    bluetooth,
    realData: realHRMData$,
    fakeData: fakeHRMData$,
  })

  const realCSCData$ = bluetooth.characteristic('csc', 'cycling_speed_and_cadence', 'csc_measurement')
  const fakeCSCData$ = xs.periodic(500)
    .map(x => {
      const d = new DataView(new ArrayBuffer(11))
      d.setUint8(0, 0x03)
      // wheel revs
      d.setUint32(1, x * 2, true)
      // wheel time
      d.setUint16(5, x * 1024 / 2 + random(256), true)
      // crank revs
      d.setUint16(7, Math.floor(x), true)
      // crank time
      d.setUint16(9, x * 1024 + random(256), true)
      return {value: d}
    })

  const cscToggle = makeDeviceToggle('csc', csc.shape, {
    DOM,
    bluetooth,
    realData: realCSCData$,
    fakeData: fakeCSCData$,
  })

  const myoCommand$ = xs.combine(slideIdx$, bluetooth.deviceConnected('myo'))
    .filter(([slideIdx, isConnected]) => isConnected)
    .map(([slideIdx, isConnected]) => isConnected && slideIdx >= slideIndexBySlug('demo-myo-finished'))
    .compose(dropRepeats())
    .map(gesturesEnabled => gesturesEnabled ? myo.enableGesturesCommand : myo.disableGesturesCommand)
    .map(command => ({
      type: 'write',
      device: 'myo',
      service: myo.controlService,
      characteristic: myo.commandCharacteristic,
      value: command,
    }))

  const deviceState$ = xs.merge(myoToggle.bluetooth, myoCommand$, hrmToggle.bluetooth, cscToggle.bluetooth)

  const slide$ = slideIdx$.map(idx => slides[idx])
  const slideSinks$ = slide$.map(
    slide => slide.main({
      DOM,
      myoData: myoToggle.data,
      hrmData: hrmToggle.data,
      cscData: cscToggle.data,
      bluetoothConsoleHistory: bluetoothConsoleHistory$,
      streamConsoleHistory: streamConsoleHistory$,
      pairwiseConsoleHistory: pairwiseConsoleHistory$,
    })
  )
  const slideDOM$ = slideSinks$.compose(pluckSink('DOM'))
  const slideAction$ = slideSinks$.compose(pluckSink('action$'))
  slideActionProxy$.imitate(slideAction$)

  const screenDOM$ = xs.combine(slide$, slideDOM$, myoToggle.DOM, hrmToggle.DOM, cscToggle.DOM)
    .map(([{slug}, slide, myoToggle, hrmToggle, cscToggle]) => (
      <div id="slide">
        <span key={slug}>
          {/* FIXME: If we put the key on the parent node, device toggles stop
              receiving events. I believe this is a @cycle/dom bug w/ isolate.
              Need to investigate further. */}
          {slide}
        </span>
        <div className="device-tray">
          {myoToggle}
          {hrmToggle}
          {cscToggle}
        </div>
      </div>
    ))

  const location$ = slide$
    .map(slide => ({
      type: 'replace',
      pathname: '/' + slide.slug,
    }))

  const sinks = {
    history: location$,
    DOM: screenDOM$,
    bluetoothConsole: slideSinks$.compose(pluckSink('bluetoothConsole')),
    streamConsole: slideSinks$.compose(pluckSink('streamConsole')),
    pairwiseConsole: slideSinks$.compose(pluckSink('pairwiseConsole')),
    bluetooth: deviceState$,
  }
  return sinks
}
