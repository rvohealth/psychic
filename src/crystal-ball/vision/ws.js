import Vision from 'src/crystal-ball/vision'

export default class WSVision extends Vision {
  constructor(route, method, params) {
    super(route, method)
    this._params = params
  }

  get params() {
    return this._params
  }
}
