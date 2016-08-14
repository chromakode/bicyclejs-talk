/** @jsx html */
import xs from 'xstream'
import {html} from 'snabbdom-jsx'

function DeviceToggleButton({name, mode, isConnected}, children) {
  return (
    <div
      class={{'device-toggle': true, [name]: true}}
      class-faked={mode === 'fake'}
      class-disconnected={mode === 'real' && !isConnected}
      class-connected={mode === 'real' && isConnected}
    >
      <span className="indicator" />
      <span className="name">{name}</span>
      {children.length ? children : ''}
    </div>
  )
}

function intent(DOM) {
  return DOM.select('.device-toggle').events('click')
    .mapTo({type: 'toggle'})
}

function model(action$) {
  return action$
    .filter(({type}) => type === 'toggle')
    .fold(mode => {
      if (mode === null) {
        return 'real'
      }
      return mode === 'real' ? 'fake' : 'real'
    }, 'fake')
    .map(mode => ({mode}))
}

function view(state$, props$) {
  return xs.combine(state$, props$)
    .map(([state, props]) =>
      <DeviceToggleButton
        name={props.name}
        mode={state.mode}
        isConnected={props.isConnected}
      />
    )
}

export default function DeviceToggle$({DOM, props}) {
  const state$ = model(intent(DOM))

  const mode$ = state$.map(({mode}) => mode)

  return {
    DOM: view(state$, props),
    mode$,
  }
}
