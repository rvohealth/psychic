import Vision from 'src/crystal-ball/vision'
import { emit } from 'src/helpers/ws'

export default class WSVision extends Vision {
  constructor(route, method, params, { io, socket }) {
    super(route, method)
    this._io = io
    this._socket = socket
    this._params = params
  }

  get io() {
    return this._io
  }

  get socket() {
    return this._socket
  }

  get params() {
    return this._params
  }

  emit(to, path, data) {
    return emit(this.io, to, path, data)
  }

  json() {
    throw `json is not implemented for web socket endpoints. use '.emit instead'`
  }
}
