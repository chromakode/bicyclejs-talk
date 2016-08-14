/** @jsx html */
import xs from 'xstream'
import {html} from 'snabbdom-jsx'

function Device({name, mode}, children) {
  return (
    <div
      className={['device', name]}
      class-faked={}
    >
      <span className="indicator" />
      <span className="name">{name}</span>
      {children.length ? children : ''}
    </div>
  )
}

export default function DeviceTray({deviceMode, deviceState}) {
  return (
    <div className="device-tray">
      <Device name="myo" mode={deviceMode.myo} />
      <Device name="hrm" mode={deviceMode.hrm} />
      <Device name="csc" mode={deviceMode.csc} />
    </div>
  )
}
