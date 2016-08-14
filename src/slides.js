/** @jsx html */
import {html} from 'snabbdom-jsx'
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import isolate from '@cycle/isolate'
import dedent from 'dedent-js'

import simpleSlide from './simpleSlide'
import stepSlide from './stepSlide'
import consoleSlide, {consoleStepSlides} from './consoleSlide'
import bluetoothSlide from './bluetoothSlide'
import HighlightedJS from './HighlightedJS'
import * as myo from './device/myo'
import * as hrm from './device/hrm'
import * as csc from './device/csc'
import {MainUI as BicycleJS} from 'bicyclejs/src/main'

const slides = []

// Hack for sharing xs with console examples
window._xs = xs
window._xs_pairwise = pairwise

slides.push(simpleSlide({
  slug: 'hello',
  view: (
    <section>
      <img style={{width: '36%'}} src={require('../art/logo.svg')} />
      <h1 className="title">bicycle.js</h1>
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'hello-from-sf',
  view: (
    <section>
      <img className="fill cover" src={require('./static/sf-bike-2.jpg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'bluetooth-logo',
  view: (
    <section>
      <img style={{width: '55%'}} src={require('./static/bluetooth-logo.svg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'harald-bluetooth',
  view: (
    <section>
      <img style={{width: '55%'}} src={require('./static/harald-bluetooth.jpg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'about-ble',
  view: (
    <section>
      <img style={{width: '55%', marginBottom: '1rem'}} src={require('./static/bluetooth-logo.svg')} />
      <h2>Bluetooth "Low Energy" (BLE)</h2>
      <h2>also known as Bluetooth Smart</h2>
    </section>
  ),
}))

const devicesSlide = simpleSlide({
  view: (
    <section className="grid">
      {[
        'pebble.png',
        'ilumi.png',
        'arduino-ble-shield.jpg',
        'casio-watches.jpg',
        'fitbit-flex.png',
        'ua-gemini.png',
        'polar-strap.jpg',
        'withings-scale.jpg',
      ].map(n => <img style={{width: '15%', margin: '1rem'}} src={require(`./static/devices/${n}`)} />)}
    </section>
  ),
})

slides.push({...devicesSlide, slug: 'about-ble-devices'})

slides.push(simpleSlide({
  slug: 'about-gatt',
  view: (
    <section>
      <h1>BLE uses GATT</h1>
      <h2 style={{marginTop: '-.5em', opacity: .5}}>"Generic Attribute Profile"</h2>
      <h2>Hierarchy of key-value pairs</h2>
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'gatt-intro',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-intro.svg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'gatt-services',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-services.svg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'gatt-services-heart-rate',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-services-heart-rate.svg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'gatt-discovery-1',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-discover-service-1.svg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'gatt-discovery-2',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-discover-service-2.svg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'gatt-discovery-3',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-discover-service-3.svg')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'about-web-bluetooth',
  view: (
    <section>
      <h1>Web Bluetooth</h1>
      <div>
        <h2>
          <img style={{width: '5rem', marginRight: '1.5rem'}} src={require('./static/chrome-logo.png')} />
          Available behind a flag
        </h2>
        <h2>
          <img style={{width: '5rem', marginRight: '1.5rem'}} src={require('./static/servo-logo.png')} />
          Under development
        </h2>
      </div>
      <h2>Web Bluetooth is experimental!</h2>
    </section>
  )
}))

slides.push(simpleSlide({
  slug: 'myo-intro',
  view: (
    <section>
      <img style={{height: '50%'}} src={require('./static/myo.png')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'myo-services',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-services-myo.svg')} />
    </section>
  ),
}))

slides.push(...consoleStepSlides('bluetooth', {
  slug: 'demo-myo-init',
  caption: 'GATT identifiers',
  command: dedent`
    // Myos advertise this service for discovery.
    // We can also send control commands here.
    var controlService = 'd5060001-a904-deb9-4748-2c7f4a124842'

    // This service gives us access to recognized gestures.
    var gestureService = 'd5060003-a904-deb9-4748-2c7f4a124842'
  `,
}))

slides.push(...consoleStepSlides('bluetooth', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-myo-request',
  caption: 'Discovering the Myo',
  command: dedent`
    // Find devices advertising the Myo control service.
    var devicePromise = navigator.bluetooth.requestDevice({
      filters: [{
        services: [controlService],
      }],

      // Request additional access to the gesture service.
      optionalServices: [gestureService],
    })
  `,
  resultName: 'devicePromise',
}))

slides.push(...consoleStepSlides('bluetooth', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-myo-gesture-connect',
  caption: 'Connecting to the Myo',
  command: dedent`
    var gattPromise = devicePromise.then(
      device => device.gatt.connect()
    )
  `,
  resultName: 'gattPromise',
}))

slides.push(simpleSlide({
  slug: 'myo-services-again',
  view: (
    <section>
      <img className="fill full" src={require('../art/gatt-services-myo.svg')} />
    </section>
  ),
}))

slides.push(...consoleStepSlides('bluetooth', {
  depends: slides[slides.length - 2].slug,
  slug: 'demo-myo-gesture-service',
  caption: 'Gesture service',
  command: dedent`
    var gestureServicePromise = gattPromise.then(
      gatt => gatt.getPrimaryService(gestureService)
    )
  `,
  resultName: 'gestureServicePromise',
}))

slides.push(...consoleStepSlides('bluetooth', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-myo-gesture-characteristic',
  caption: 'Gesture characteristic',
  command: dedent`
    var gestureCharacteristic = 'd5060103-a904-deb9-4748-2c7f4a124842'
    var gestureCharacteristicPromise = gestureServicePromise.then(
      service => service.getCharacteristic(gestureCharacteristic)
    )
  `,
  resultName: 'gestureCharacteristicPromise',
}))

slides.push(...consoleStepSlides('bluetooth', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-myo-gesture-listen',
  caption: 'Observing changes',
  preCommand: dedent`
    function parseMyoGesture(value) {
      if (value.getUint8(0) === 0x03) {
        const gestureValue = value.getUint16(1, true)
        const gesture = {
          0x0000: 'rest',
          0x0001: 'fist',
          0x0002: 'wave-in',
          0x0003: 'wave-out',
          0x0004: 'fingers-spread',
          0x0005: 'double-tap',
          0xffff: 'unknown',
        }[gestureValue]
        return {gesture}
      }
      return {gesture: null}
    }
  `,
  command: dedent`
    gestureCharacteristicPromise.then(characteristic => {
      characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged',
        ev => {
          const gesture = parseMyoGesture(ev.target.value)
          console.log('gesture', gesture)
        }
      )
    })
  `,
}))

slides.push(consoleSlide('bluetooth', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-myo-not-sending',
  caption: 'No events...?',
  command: '// ?!?',
  execute: false,
}))

slides.push(...consoleStepSlides('bluetooth', {
  depends: slides[slides.length - 2].slug,
  slug: 'demo-myo-gesture-enable-data',
  caption: 'Creating a binary command',
  command: dedent`
    var enableGesturesCommand = new Uint8Array(5)
    enableGesturesCommand[0] = 0x01  // set mode
    enableGesturesCommand[1] = 0x03  // bytes in payload
    enableGesturesCommand[2] = 0x00  // emg mode: none
    enableGesturesCommand[3] = 0x00  // imu mode: disabled
    enableGesturesCommand[4] = 0x01  // classifier mode: enabled
  `,
  resultName: 'enableGesturesCommand',
}))

slides.push(...consoleStepSlides('bluetooth', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-myo-gesture-enable-send',
  caption: 'Sending the command...',
  command: dedent`
    var commandCharacteristic = 'd5060401-a904-deb9-4748-2c7f4a124842'
    gattPromise
      .then(gatt => gatt.getPrimaryService(controlService))
      .then(service => service.getCharacteristic(commandCharacteristic))
      .then(characteristic => characteristic.writeValue(enableGesturesCommand))
  `,
}))

slides.push(consoleSlide('bluetooth', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-myo-finished',
  caption: '\\o/',
  command: '// it works!',
  execute: false,
}))

slides.push(simpleSlide({
  slug: 'magic',
  view: (
    <section>
      <img className="fill" src={require('./static/magic.gif')} />
    </section>
  ),
}))

slides.push(bluetoothSlide({
  slug: 'real-time-data',
  output: ({myoData}) => myoData.map(({value}) => myo.parseMyoGesture(value)),
  code: (
    <h1>real-time data</h1>
  )
}))

slides.push(simpleSlide({
  slug: 'about-streams',
  view: (
    <section>
      <img className="fill cover" src={require('./static/stream.jpg')} />
      <div className="credit"><a href="https://commons.wikimedia.org/wiki/File:Urban_stream_in_park.jpg">https://commons.wikimedia.org/wiki/File:Urban_stream_in_park.jpg</a></div>
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'about-streams-really',
  view: (
    <section>
      <img className="fill cover" style={{position: 'absolute'}} src={require('./static/balls.gif')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'about-streams-cycle',
  view: (
    <section>
      <img style={{width: '60%'}} src={require('./static/cycle.svg')} />
      <div className="credit"><a href="http://cycle.js.org">http://cycle.js.org</a></div>
    </section>
  ),
}))

slides.push(...consoleStepSlides('stream', {
  slug: 'demo-streams-xstream',
  caption: 'Hello xstream!',
  preCommand: `function require() { return window.top._xs }`,
  command: `var xs = require('xstream')`,
}))

slides.push(...consoleStepSlides('stream', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-streams-numbers',
  caption: 'A stream of numbers',
  command: `var numbers$ = xs.of(1, 2, 3, 4, 5)`,
}))

slides.push(...consoleStepSlides('stream', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-streams-numbers-print',
  caption: 'Adding a listener',
  command: dedent`
    function printStream(stream$) {
      stream$.addListener({
        next: i => console.log(i),
        error: err => console.log('error:', error),
        complete: () => console.log('complete!'),
      })
    }
    printStream(numbers$)
  `,
}))

slides.push(...consoleStepSlides('stream', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-streams-numbers-map',
  caption: 'Mapping over values',
  command: dedent`
    var bigNumbers$ = numbers$.map(x => x * 10)
    printStream(bigNumbers$)
  `,
}))

slides.push(...consoleStepSlides('stream', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-streams-periodic',
  caption: 'Streams transform live data',
  command: dedent`
    // A stream counting up from 0 every second.
    var count$ = xs.periodic(1000)

    // Only numbers greater than 5 are emitted here!
    var finished$ = count$.filter(x => x > 5)

    printStream(count$.endWhen(finished$))
  `,
}))

slides.push(simpleSlide({
  slug: 'myo-declaration',
  view: (
    <section className="row">
      <img style={{height: '32%', marginRight: '8vw'}} src={require('./static/myo.png')} />
      <HighlightedJS>{dedent`
        // A Myo looks like this!
        {
          filters: [{
            services: [myoControlService],
          }],
          optionalServices: [myoGestureService],
          listen: {
            [myoGestureService]: [
              myoGestureCharacteristic,
            ]
          },
        }
      `}</HighlightedJS>
    </section>
  ),
}))

slides.push(bluetoothSlide({
  slug: 'myo-stream',
  caption: 'Myo gesture data stream',
  output: ({myoData}) => myoData.map(({value}) => value),
  code: (
    <HighlightedJS>{dedent`
      var rawGesture$ = bluetooth.characteristic(
        'myo',
        myoGestureService,
        myoGestureCharacteristic
      )
    `}</HighlightedJS>
  )
}))

slides.push(simpleSlide({
  slug: 'myo-stream-parse-code',
  view: (
    <section className="code-slide">
      <h2 className="caption">Parsing Myo gestures</h2>
      <HighlightedJS>{dedent`
        const poseMap = new Map([
          [0x0000, 'rest'],
          [0x0001, 'fist'],
          [0x0002, 'wave-in'],
          [0x0003, 'wave-out'],
          [0x0004, 'fingers-spread'],
          [0x0005, 'double-tap'],
          [0xffff, 'unknown'],
        ])

        function parseMyoGesture({value}) {
          if (value.getUint8(0) === 0x03) {
            const poseValue = value.getUint16(1, true)
            const gesture = poseMap.get(poseValue)
            return {gesture}
          }
          return {gesture: null}
        }
      `}</HighlightedJS>
    </section>
  )
}))


slides.push(bluetoothSlide({
  slug: 'myo-stream-parse',
  caption: 'Myo gesture event stream',
  input: ({myoData}) => myoData.map(({value}) => value),
  output: ({myoData}) => myoData.map(({value}) => myo.parseMyoGesture(value)),
  code: (
    <HighlightedJS>rawGesture$.map(parseMyoGesture)</HighlightedJS>
  )
}))

slides.push(simpleSlide({
  slug: 'hrm-intro',
  view: (
    <section>
      <img style={{height: '50%'}} src={require('./static/miio-link.png')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'hrm-intro-detail',
  view: (
    <section>
      <img className="full fill" src={require('./static/miio-link-glow.png')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'hrm-declaration',
  view: (
    <section className="row">
      <img style={{height: '32%', marginRight: '8vw'}} src={require('./static/miio-link.png')} />
      <HighlightedJS>{dedent`
        {
          filters: [{
            services: ['heart_rate'],
          }],
          listen: {
            'heart_rate': [
              'heart_rate_measurement',
            ],
          },
        }
      `}</HighlightedJS>
    </section>
  ),
}))

slides.push(bluetoothSlide({
  slug: 'hrm-stream',
  caption: 'Heart rate data stream',
  output: ({hrmData}) => hrmData.map(({value}) => value),
  code: (
    <HighlightedJS>{dedent`
      var rawHeartRate$ = bluetooth.characteristic(
        'hrm',
        'heart_rate',
        'heart_rate_measurement'
      )
    `}</HighlightedJS>
  )
}))

slides.push(simpleSlide({
  slug: 'hrm-stream-spec-1',
  view: (
    <section className="web-slide">
      <a className="url" href="https://www.bluetooth.com/specifications/gatt/characteristics">https://www.bluetooth.com/specifications/gatt/characteristics</a>
      <img className="fill cover" src={require('./static/bluetooth-characteristics.png')} />
    </section>
  )
}))

slides.push(simpleSlide({
  slug: 'hrm-stream-spec-2',
  view: (
    <img className="fill cover" src={require('./static/bluetooth-characteristics-heartrate.png')} />
  )
}))

slides.push(simpleSlide({
  slug: 'hrm-stream-spec-3',
  view: (
    <img className="fill cover" src={require('./static/bluetooth-heartrate-spec.png')} />
  )
}))

slides.push(simpleSlide({
  slug: 'hrm-stream-spec-4',
  view: (
    <img className="fill cover" src={require('./static/bluetooth-heartrate-spec-2.png')} />
  )
}))

slides.push(simpleSlide({
  slug: 'hrm-stream-parse-code',
  view: (
    <section className="code-slide">
      <h2 className="caption">Parsing heart rate data</h2>
      <HighlightedJS className="small">{dedent`
        // from https://webbluetoothcg.github.io/web-bluetooth
        export function parseHeartRate(value) {
          let flags = value.getUint8(0)
          let rate16Bits = flags & 0x1
          let result = {}
          let index = 1
          if (rate16Bits) {
            result.heartRate = value.getUint16(index, /*littleEndian=*/true)
            index += 2
          } else {
            result.heartRate = value.getUint8(index)
            index += 1
          }
          let contactDetected = flags & 0x2
          let contactSensorPresent = flags & 0x4
          if (contactSensorPresent) {
            result.contactDetected = !!contactDetected
          }
          let energyPresent = flags & 0x8
          if (energyPresent) {
            result.energyExpended = value.getUint16(index, /*littleEndian=*/true)
            index += 2
          }
          let rrIntervalPresent = flags & 0x10
          if (rrIntervalPresent) {
            let rrIntervals = []
            for (; index + 1 < value.byteLength; index += 2) {
              rrIntervals.push(value.getUint16(index, /*littleEndian=*/true))
            }
            result.rrIntervals = rrIntervals
          }
          return result
        }
      `}</HighlightedJS>
    </section>
  )
}))

slides.push(bluetoothSlide({
  slug: 'hrm-stream-parse',
  caption: 'Heart rate measurement stream',
  input: ({hrmData}) => hrmData.map(({value}) => value),
  output: ({hrmData}) => hrmData.map(({value}) => hrm.parseHeartRate(value)),
  code: (
    <HighlightedJS>rawHeartRate$.map(parseHeartRate)</HighlightedJS>
  )
}))

slides.push(simpleSlide({
  slug: 'csc-intro',
  view: (
    <section>
      <img style={{height: '50%'}} src={require('./static/wahoo-bluesc.png')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'csc-intro-detail',
  view: (
    <section>
      <img className="fill cover" src={require('./static/wahoo-bluesc-bike.png')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'csc-intro-stopwatch',
  view: (
    <section>
      <img style={{height: '65%'}} src={require('./static/stopwatch.png')} />
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'csc-declaration',
  view: (
    <section className="row">
      <img style={{height: '32%', marginRight: '8vw'}} src={require('./static/wahoo-bluesc-only.png')} />
      <HighlightedJS>{dedent`
        {
          filters: [{
            services: ['cycling_speed_and_cadence'],
          }],
          listen: {
            'cycling_speed_and_cadence': [
              'csc_measurement',
            ],
          },
        }
      `}</HighlightedJS>
    </section>
  ),
}))

slides.push(bluetoothSlide({
  slug: 'csc-stream',
  caption: 'Cycling sensor data stream',
  output: ({cscData}) => cscData.map(({value}) => value),
  code: (
    <HighlightedJS>{dedent`
      var rawCSC$ = bluetooth.characteristic(
        'csc',
        'cycling_speed_and_cadence',
        'csc_measurement'
      )
    `}</HighlightedJS>
  )
}))

/*
slides.push(simpleSlide({
  slug: 'csc-stream-parse-code',
  view: (
    <section className="code-slide">
      <h2 className="caption">Parsing cycling sensor data</h2>
      <HighlightedJS className="small">{dedent`
        function parseCSC({value}) {
          const flags = value.getUint8(0, true)
          const hasWheel = !!(flags & 0x01)
          const hasCrank = !!(flags & 0x02)
          let index = 1
          const res = {wheelRevs: null, wheelTime: null, crankRevs: null, crankTime: null}
          if (hasWheel) {
            res.wheelRevs = value.getUint32(index, true)
            index += 4
            res.wheelTime = value.getUint16(index, true)
            index += 2
          }
          if (hasCrank) {
            res.crankRevs = value.getUint16(index, true)
            index += 2
            res.crankTime = value.getUint16(index, true)
            index += 2
          }
          return res
        }
      `}</HighlightedJS>
    </section>
  )
}))
*/

slides.push(bluetoothSlide({
  slug: 'csc-stream-parse',
  caption: 'Revolution count stream',
  input: ({cscData}) => cscData.map(({value}) => value),
  output: ({cscData}) => cscData.map(({value}) => csc.parseCSC(value)),
  code: (
    <HighlightedJS>rawCSC$.map(parseCSC)</HighlightedJS>
  )
}))

slides.push(simpleSlide({
  slug: 'csc-distance-code',
  view: (
    <section className="code-slide">
      <h2 className="caption">Revolutions into distance</h2>
      <HighlightedJS>{dedent`
        const wheelSize = 622  // mm; 700C
        const wheelCircumference = Math.PI * 622
        function revsToKM(revs) {
          const mm = revs * wheelCircumference
          const km = mm / 1e6
          return km
        }
      `}</HighlightedJS>
    </section>
  )
}))

slides.push(bluetoothSlide({
  slug: 'csc-distance',
  caption: 'Distance stream',
  input: ({cscData}) => cscData.map(({value}) => csc.parseCSC(value)),
  output: ({cscData}) => cscData.map(({value}) => csc.parseCSC(value)).map(({wheelRevs}) => csc.revsToKM(wheelRevs)),
  code: (
    <HighlightedJS>{`csc$.map(({wheelRevs}) => revsToKM(wheelRevs))`}</HighlightedJS>
  )
}))

/*
slides.push(simpleSlide({
  slug: 'csc-rpm-code',
  view: (
    <section className="code-slide">
      <h2 className="caption">Revolutions into RPM</h2>
      <HighlightedJS>{dedent`
        function revsToRPM(t1, t2) {
          const deltaRevs = t2.revs - t1.revs
          if (deltaRevs === 0) {
            // no rotation
            return 0
          }

          let deltaTime = (t2.time - t1.time) / 1024
          if (deltaTime < 0) {
            // time counter wraparound
            deltaTime += Math.pow(2, 16) / 1024
          }
          deltaTime /= 60  // seconds to minutes

          const rpm = deltaRevs / deltaTime
          return rpm
        }
      `}</HighlightedJS>
    </section>
  )
}))
*/

slides.push(simpleSlide({
  slug: 'csc-speed-formula-1',
  view: (
    <section>
      <h2 className="caption">Determining speed</h2>
      <HighlightedJS className="large">rpm = revs / minute</HighlightedJS>
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'csc-speed-formula-2',
  view: (
    <section>
      <h2 className="caption">Determining speed</h2>
      <HighlightedJS className="large">(revs2 - revs1) / (time2 - time1)</HighlightedJS>
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'csc-speed-formula-3',
  view: (
    <section>
      <h2>How do we get the previous value?</h2>
    </section>
  ),
}))

slides.push(...consoleStepSlides('pairwise', {
  slug: 'demo-pairwise-xstream',
  caption: 'Pairwise streams',
  preCommand: `function require(m) { return m === 'xstream' ? window.top._xs : window.top._xs_pairwise }`,
  command: dedent`
    var xs = require('xstream')
    var pairwise = require('xstream/extra/pairwise')
    var numbers$ = xs.of(1, 2, 3, 4, 5)
  `,
}))

slides.push(...consoleStepSlides('pairwise', {
  depends: slides[slides.length - 1].slug,
  slug: 'demo-pairwise',
  caption: 'Pairs of numbers!',
  preCommand: dedent`
    function printStream(stream$) {
      stream$.addListener({
        next: i => console.log(i),
        error: err => console.log('error:', error),
        complete: () => console.log('complete!'),
      })
    }
  `,
  command: `printStream(numbers$.compose(pairwise))`,
}))

function makeRPMStream(cscData) {
  return cscData
    .map(({value}) => csc.parseCSC(value))
    .compose(pairwise)
    .map(([t1, t2]) => csc.revsToRPM(
      {revs: t1.wheelRevs, time: t1.wheelTime},
      {revs: t2.wheelRevs, time: t2.wheelTime}
    ))
}

slides.push(bluetoothSlide({
  slug: 'csc-crank-rpm',
  caption: 'Cadence (RPM) stream',
  input: ({cscData}) => cscData.map(({value}) => csc.parseCSC(value)),
  output: ({cscData}) => makeRPMStream(cscData),
  code: (
    <HighlightedJS>{dedent`
      csc$
        .compose(pairwise)
        .map(([t1, t2]) => revsToRPM(
          {revs: t1.crankRevs, time: t1.crankTime},
          {revs: t2.crankRevs, time: t2.crankTime}
        ))
    `}</HighlightedJS>
  )
}))

slides.push(bluetoothSlide({
  slug: 'csc-wheel-rpm',
  caption: 'Speed (RPM) stream',
  input: ({cscData}) => cscData.map(({value}) => csc.parseCSC(value)),
  output: ({cscData}) => makeRPMStream(cscData),
  code: (
    <HighlightedJS>{dedent`
      csc$
        .compose(pairwise)
        .map(([t1, t2]) => revsToRPM(
          {revs: t1.wheelRevs, time: t1.wheelTime},
          {revs: t2.wheelRevs, time: t2.wheelTime}
        ))
    `}</HighlightedJS>
  )
}))

/*
slides.push(simpleSlide({
  slug: 'csc-speed-code',
  view: (
    <section className="code-slide">
      <h2 className="caption">RPM into KPH</h2>
      <HighlightedJS>{dedent`
        function rpmToKPH(rpm) {
          const rph = rpm * 60
          const mmph = rph * wheelCircumference
          const kph = mmph / 1e6
          return kph
        }
        kph$ = rpm$.map(rpmToKPH)
      `}</HighlightedJS>
    </section>
  )
}))
*/

slides.push(bluetoothSlide({
  slug: 'csc-kph',
  caption: 'Speed (KPH) stream',
  input: ({cscData}) => makeRPMStream(cscData),
  output: ({cscData}) => makeRPMStream(cscData).map(csc.rpmToKPH),
  code: (
    <HighlightedJS>{dedent`
      function rpmToKPH(rpm) {
        const rph = rpm * 60
        const mmph = rph * wheelCircumference
        const kph = mmph / 1e6
        return kph
      }

      kph$ = rpm$.map(rpmToKPH)
    `}</HighlightedJS>
  )
}))

slides.push({
  slug: 'all-together',
  caption: 'Putting it all together',
  main: ({DOM, hrmData, cscData}) => {
    const time$ = xs.periodic(1000).startWith(0).map(() => Date.now())
    const bicycleJS = isolate(BicycleJS)({DOM, time: time$, hrmData, cscData})
    return {
      DOM: bicycleJS.metrics$
        .map((metrics) => (
          <section className="row bluetooth-slide all-together-slide">
            <h2 className="caption">Putting it all together</h2>
            <img style={{width: '10rem', marginRight: '3em'}} src={require('../art/logo.svg')} />
            <div style={{width: '25rem'}}>
              {['heartRate', 'kph', 'cadence', 'distance'].map(metric => (
                <div className="line">
                  <HighlightedJS className="name">{metric + '$'}</HighlightedJS>
                  <div className="arrow">&rArr;</div>
                  <div className="output">
                    <HighlightedJS>{JSON.stringify({[metric]: metrics[metric]})}</HighlightedJS>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
    }
  },
})

slides.push(simpleSlide({
  slug: 'all-together-streams',
  view: (
    <section>
      <h2 className="caption">Dataflow</h2>
      <img className="fill cover" src={require('../art/streams.svg')} />
    </section>
  )
}))

slides.push(simpleSlide({
  slug: 'all-together-streams-to',
  view: (
    <section>
      <img className="fill cover" src={require('../art/streams-to.svg')} />
    </section>
  )
}))

slides.push(simpleSlide({
  slug: 'all-together-streams-to-dom',
  view: (
    <section>
      <img className="fill cover" src={require('../art/streams-to-dom.svg')} />
    </section>
  )
}))


slides.push(simpleSlide({
  slug: 'maybe-handlebars',
  view: (
    <section>
      <img className="fill cover" src={require('./static/handlebars.png')} />
    </section>
  )
}))

slides.push(simpleSlide({
  slug: 'using-cyclejs',
  view: (
    <section>
      <img style={{width: '25%', marginLeft: '-3%', marginBottom: '1em'}} src={require('./static/cyclejs-logo.svg')} />
      <HighlightedJS>npm install @cycle/dom</HighlightedJS>
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'view-stream',
  view: (
    <section>
      <h2 className="caption">The view is a stream too!</h2>
      <HighlightedJS>{`metrics$.map(metrics => <BicycleJS metrics={metrics}>)`}</HighlightedJS>
    </section>
  )
}))

slides.push({
  slug: 'bicycle-demo',
  main: ({DOM, hrmData, cscData}) => {
    const time$ = xs.periodic(1000).startWith(0).map(() => Date.now())
    const bicycleJS = isolate(BicycleJS)({DOM, time: time$, hrmData, cscData})
    return {
      DOM: bicycleJS.DOM
        .map(bicycleDOM => (
          <section className="bicycle-js">
            {bicycleDOM}
          </section>
        ))
    }
  },
})

slides.push(simpleSlide({
  slug: 'the-web-is-changing',
  view: (
    <section>
      <h1>The web is changing</h1>
    </section>
  )
}))

slides.push(simpleSlide({
  slug: 'bicyclejs-on-phone',
  view: (
    <section>
      <img className="fill cover" src={require('./static/on-phone.jpg')} />
    </section>
  )
}))

slides.push({...devicesSlide, slug: 'many-possibilities'})

slides.push(simpleSlide({
  slug: 'robots',
  view: (
    <section>
      <img className="fill cover" src={require('./static/arduino-bot.jpg')} />
      <div className="credit"><a href="https://commons.wikimedia.org/wiki/File:Arduino_Sunday_Mk._II.jpg">https://commons.wikimedia.org/wiki/File:Arduino_Sunday_Mk._II.jpg</a></div>
    </section>
  )
}))

slides.push(...stepSlide({
  slug: 'security',
  view: content => (
    <section className="security-slide">
      <h1>What about security?</h1>
      <div>
        {content || ''}
      </div>
    </section>
  ),
  steps: [
    <h2>Access to devices requires user interaction</h2>,
    <h2>Buggy bluetooth devices could be targets</h2>,
    <h2>Nearby device ids could de-anonymize you</h2>,
    <h2>Scanning for devices broadcasts your device id</h2>,
  ]
}))

slides.push(simpleSlide({
  slug: 'more-information',
  view: (
    <section>
      <h2>Want to take it for a spin?</h2>
      <h2><a href="https://github.com/WebBluetoothCG/web-bluetooth">github.com/WebBluetoothCG</a></h2>
      <h2><a href="https://googlechrome.github.io/samples/web-bluetooth">googlechrome.github.io/samples/web-bluetooth</a></h2>
    </section>
  ),
}))

slides.push(simpleSlide({
  slug: 'thanks',
  view: (
    <section>
      <h1>Thanks!</h1>
      <h2><a href="https://github.com/chromakode/bicyclejs-talk">github.com/chromakode/bicyclejs-talk</a></h2>
      <p>Want to play? Come say hi and borrow my sensors!</p>
      <p style={{marginTop: '3rem'}}>Thanks to André Staltz for creating cyclejs and xstream.</p>
      <p style={{marginTop: '1.5rem'}}>...and to Halldor Jonasson for providing his bike!</p>
    </section>
  ),
}))

const _slideIndexBySlug = {}
slides.forEach((slide, idx) => {
  _slideIndexBySlug[slide.slug] = idx
})

function slideIndexBySlug(slug) {
  return _slideIndexBySlug[slug]
}

export {
  slides,
  slideIndexBySlug,
}
