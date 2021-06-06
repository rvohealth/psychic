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

  json(obj, { projection }={}) {
    if (obj.isDream)
      return this.response.json(this.project(obj, projection))

    if (Array.isArray(obj) && obj[0].isDream)
      return this.response.json(
        obj.map(dream => this.project(dream, projection))
      )

    return this.response.json(obj)
  }
}
