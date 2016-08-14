export const controlService = 'd5060001-a904-deb9-4748-2c7f4a124842'
export const gestureService = 'd5060003-a904-deb9-4748-2c7f4a124842'
export const commandCharacteristic = 'd5060401-a904-deb9-4748-2c7f4a124842'
export const gestureCharacteristic = 'd5060103-a904-deb9-4748-2c7f4a124842'

export const enableGesturesCommand = new Uint8Array(5)
enableGesturesCommand[0] = 0x01  // set mode
enableGesturesCommand[1] = 0x03  // bytes in payload
enableGesturesCommand[2] = 0x00  // emg mode: none
enableGesturesCommand[3] = 0x00  // imu mode: disabled
enableGesturesCommand[4] = 0x01  // classifier mode: enabled

export const disableGesturesCommand = Uint8Array.from(enableGesturesCommand)
disableGesturesCommand[4] = 0x00  // classifier mode: disabled

export const deepSleepCommand = new Uint8Array(2)
deepSleepCommand[0] = 0x04  // set mode
deepSleepCommand[1] = 0x00  // bytes in payload

export const poseMap = new Map([
  [0x0000, 'rest'],
  [0x0001, 'fist'],
  [0x0002, 'wave-in'],
  [0x0003, 'wave-out'],
  [0x0004, 'fingers-spread'],
  [0x0005, 'double-tap'],
  [0xffff, 'unknown'],
])

export function parseMyoGesture(value) {
  if (value.getUint8(0) === 0x03) {
    const poseValue = value.getUint16(1, true)
    const gesture = poseMap.get(poseValue)
    return {gesture}
  }
  return {gesture: null}
}

export const shape = {
  filters: [{
    services: [controlService],
  }],
  optionalServices: [gestureService],
  listen: {
    [gestureService]: [
      gestureCharacteristic,
    ]
  },
}

export function gestureStream(bluetooth, device) {
  return bluetooth.characteristic(device, gestureService, gestureCharacteristic)
    .map(({value}) => parseMyoGesture(value))
    .startWith({gesture: null})
}
