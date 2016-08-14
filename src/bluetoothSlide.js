/** @jsx html */
import {html} from 'snabbdom-jsx'
import xs from 'xstream'
import inspect from 'object-inspect'
import ByteBuffer from 'byte-buffer'

import HighlightedJS from './HighlightedJS'

function display(obj) {
  if (obj instanceof DataView) {
    const hexText = new ByteBuffer(obj).toHex()
    // FIXME: without a key, snabbdom diff crashes on removeChild
    return <code key='hex'><span className="hex token number">{hexText}</span></code>
  }
  return <HighlightedJS>{inspect(obj)}</HighlightedJS>
}

export default function bluetoothSlide({slug, caption, input, output, showInput, code}) {
  function main(sources) {
    const input$ = input ? input(sources).startWith('...') : xs.of(null)
    const output$ = output ? output(sources).startWith('...') : xs.of(null)
    const slide$ = xs.combine(input$, output$)
      .map(([input, output]) => (
        <section className="bluetooth-slide">
          {caption ? <h2 className="caption">{caption}</h2> : ''}
          {input !== null ? <div className="input">{display(input)}</div> : ''}
          {input !== null ? <div className="arrow">&#8659;</div> : ''}
          <div className="stream-code">{code}</div>
          {output !== null? <div className="arrow">&#8659;</div> : ''}
          {output !== null ? <div className="output">{display(output)}</div> : ''}
        </section>
      ))

    return {DOM: slide$}
  }

  return {
    slug,
    main,
  }
}

