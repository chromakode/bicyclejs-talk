import xs from 'xstream'
import flattenSequentially from 'xstream/extra/flattenSequentially'
import _ from 'lodash'

function newConsole$(command$) {
  return xs.create({
    start(listener) {
      const env = this._env = document.createElement('iframe')
      env.style.display = 'none'
      document.body.appendChild(env)

      env.contentWindow.console = {
        log: (...data) => listener.next({
          type: 'log',
          data,
        }),
      }

      command$
        .map(({command, key}) => ({
          type: 'run',
          key,
          command,
        }))
        .addListener(listener)

      command$
        .map(({command, resultName, key}) => {
          let result
          try {
            result = env.contentWindow.eval(command)
          } catch (error) {
            return xs.of({
              type: 'error',
              key,
              command,
              error,
            })
          }
          if (resultName) {
            result = env.contentWindow[resultName]
          }
          return xs.fromPromise(Promise.resolve(result))
            .map(value => ({
              type: 'result',
              key,
              command,
              result: value,
            }))
            .replaceError(error => xs.of({
              type: 'error',
              key,
              command,
              error,
            }))
        })
        .compose(flattenSequentially)
        .addListener(listener)
    },

    stop() {
      document.body.removeChild(this._env)
    }
  })
}

export function makeConsoleHistory(console$) {
  const empty = {history: [], index: {}, lastCommand: null}

  const consoleHistory$ = console$
    .fold((prev, ev) => {
      if (ev.type === 'start') {
        return {...empty}
      }

      let index = prev.index
      let lastCommand = prev.lastCommand
      if (ev.type === 'run') {
        if (lastCommand) {
          index = {...prev.index, [prev.lastCommand]: prev.history.length - 1}
        }
        lastCommand = ev.key
      }

      let history = prev.history.concat(_.cloneDeep(ev))
      index = {...prev.index, [lastCommand]: history.length - 1}

      return {
        index,
        lastCommand,
        history,
      }
    }, {...empty})

  // persist even when we have no listeners
  consoleHistory$.addListener({next: () => {}, error: () => {}, complete: () => {}})

  return consoleHistory$
}

export default function makeConsoleDriver() {
  function consoleDriver(action$) {
    const reset$ = action$
      .filter(({type}) => type === 'reset')
      .mapTo(null)

    const command$ = action$
      .filter(({type}) => type === 'run')

    return reset$
      .startWith(null)
      .map(() => newConsole$(command$).startWith({type: 'start'}))
      .flatten()
  }

  return consoleDriver
}
