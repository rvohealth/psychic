import Vision from 'src/crystal-ball/vision'

export default class HTTPVision extends Vision {
  constructor(route, method, expressRequest, expressResponse) {
    super(route, method)
    this._expressRequest = expressRequest
    this._expressResponse = expressResponse
  }

  get request() {
    return this._expressRequest
  }

  get response() {
    return this._expressResponse
  }

  get params() {
    return {
      ...this.request.params || {},
      ...this.request.query || {},
      ...this.request.body || {},
    }
  }
}
