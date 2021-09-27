import InvalidEventType from 'src/error/esp/invalid-event-type'

class ESP {
  static EVENT_TYPES = [
    'ws:to:authToken',
  ]

  get listeners() {
    return this._listeners
  }

  constructor() {
    this._listeners = {}
    this.constructor.EVENT_TYPES.forEach(eventType => {
      this._listeners[eventType] = []
    })
  }

  transmit(eventType, payload) {
    this._validateEventType(eventType)
    this
      .listenersFor(eventType)
      .forEach(cb => {
        cb(payload)
      })
  }

  listenersFor(eventType) {
    return this.listeners[eventType]
  }

  on(eventType, cb) {
    this._validateEventType(eventType)
    this._listeners[eventType].push(cb)
  }

  _validateEventType(eventType) {
    if (!this.constructor.EVENT_TYPES.includes(eventType))
      throw new InvalidEventType(eventType)
  }
}

export default new ESP()
