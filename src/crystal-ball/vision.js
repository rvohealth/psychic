import Projection from 'src/projection'

export default class Vision {
  get auth() {
    return this._auth
  }

  get route() {
    return this._route
  }

  get method() {
    return this._method
  }

  constructor(route, method) {
    this._route = route
    this._method = method
    this._auth = {}
  }

  setAuth(key, dream) {
    this._auth[key] = dream
  }

  project(obj, projection=this.projection) {
    if (projection) return new projection(obj).cast()
    return new Projection(obj).cast()
  }
}
