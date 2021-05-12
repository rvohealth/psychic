export default class Vision {
  get request() {
    return this._expressRequest
  }

  get response() {
    return this._expressResponse
  }

  get route() {
    return this._route
  }

  get method() {
    return this._method
  }

  constructor(route, method, expressRequest, expressResponse) {
    this._route = route
    this._method = method
    this._expressRequest = expressRequest
    this._expressResponse = expressResponse
  }
}
