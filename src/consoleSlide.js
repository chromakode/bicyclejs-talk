/** @jsx html */
import {html} from 'snabbdom-jsx'
import xs from 'xstream'
import inspect from 'object-inspect'

import HighlightedJS from './HighlightedJS'


function display(obj) {
  let name
  try {
    name = Object.getPrototypeOf(obj).constructor.name
  } catch (err) {}
  const details = inspect(obj)
  return name ? `${name} ${details}` : details
}

function ConsoleLine({data}) {
  if (data.type === 'run') {
    return <HighlightedJS className="run">{data.command}</HighlightedJS>
  } else if (data.type === 'result') {
    return <HighlightedJS className="result">{display(data.result)}</HighlightedJS>
  } else if (data.type === 'error') {
    return <code className="result error">{display(data.error)}</code>
  } else if (data.type === 'log') {
    return <HighlightedJS className="log">{data.data.map(display).join(' ')}</HighlightedJS>
  }

}

function ConsoleSlide({caption, log}) {
  const lines = log
    .filter(({key}) => !key || key.substr(0, 4) != 'pre:')
    .map((line, idx) => <ConsoleLine data={line} />)

  return (
    <section className="console-slide">
      <h2 className="caption">{caption}</h2>
      <div className="console">
        {lines}
      </div>
    </section>
  )
}

// TODO: better fading -- don't fade latest command's console and output
// maybe don't display output? but how to know when run?
export default function consoleSlide(key, {slug, depends, caption, preCommand, command, resultName, execute}) {
  return {
    slug,
    main: sources => {
      const consoleHistory$ = sources[key + 'ConsoleHistory']
      const state$ = consoleHistory$
        .take(1)
        .map(({index}) => ({
          canExecute: !depends || index.hasOwnProperty(depends),
          hasExecuted: index.hasOwnProperty(slug),
        }))

      const action$ = state$
        .map(({canExecute}) =>
          // TODO: gentler invalid slide reset behavior
          !canExecute ? {type: 'changeSlide', jumpTo: 0} : null
        )
        .filter(x => x)

      const slideContent$ = xs.combine(state$, consoleHistory$)
        .map(([{canExecute}, consoleHistory]) => {
          const logEnd = execute ? slug : depends
          const logContents = consoleHistory.history.slice(0, consoleHistory.index[logEnd] + 1)
          if (!execute) {
            logContents.push({type: 'run', command, key: slug})
          }

          return (
            <ConsoleSlide
              caption={caption}
              log={logContents}
            />
          )
        })

      const command$ = state$
        .map(({canExecute, hasExecuted}) => {
          if (!execute || !canExecute || hasExecuted) {
            return
          }

          const commands = []
          if (preCommand) {
            commands.push({type: 'run', command: preCommand, key: 'pre:' + slug})
          }
          commands.push({type: 'run', command, resultName, key: slug})
          return xs.fromArray(commands)
        })
        .filter(x => x)
        .flatten()

      return {
        DOM: slideContent$,
        [key + 'Console']: command$,
        action$,
      }
    },
  }
}

export function consoleStepSlides(sourceKey, params) {
  return [
    consoleSlide(sourceKey, {...params, slug: params.slug + '-before', execute: false}),
    consoleSlide(sourceKey, {...params, execute: true}),
  ]
}
