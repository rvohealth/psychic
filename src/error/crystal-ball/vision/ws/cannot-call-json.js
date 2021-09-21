import WSVisionError from 'src/error/crystal-ball/vision/ws'

export default class CannotCallJSON extends WSVisionError {
  constructor() {
    super(
`
Cannot call the json method on WS routes.

instead, try running:
this.emit(user, '/route/to/call', data)

where user in this case would represent a dream instance with authentication support defined.
`
    )
  }
}




