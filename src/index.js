import xs from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/xstream-run'
import {makeDOMDriver} from '@cycle/dom'
import {makeHistoryDriver} from '@cycle/history'
import createHistory from 'history/lib/createHashHistory'

import main from './main'
import makeConsoleDriver from './makeConsoleDriver'
import makeBluetoothDriver from 'cycle-web-bluetooth'

const drivers = {
  DOM: makeDOMDriver('#app'),
  keydown: () => fromEvent(window, 'keydown'),
  history: makeHistoryDriver(createHistory()),
  bluetoothConsole: makeConsoleDriver(),
  streamConsole: makeConsoleDriver(),
  pairwiseConsole: makeConsoleDriver(),
  bluetooth: makeBluetoothDriver({debug: true}),
}

run(main, drivers)
