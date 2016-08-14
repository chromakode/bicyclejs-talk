/** @jsx html */
import {html} from 'snabbdom-jsx'
import prism from 'prismjs'

export default function HighlightedJS({className, style}, [text]) {
  const innerHTML = prism.highlight(text, prism.languages.js)
  return <code className={className} style={style} innerHTML={innerHTML} />
}
