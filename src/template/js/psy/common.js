import axios from 'axios'
import io from 'src/psy/singletons/io'

export default class Common {
  static get(...args) {
    return axios.get(...args)
  }

  static post(url, data, opts) {
    return axios.post(this._url(url), data, opts)
  }

  static put(...args) {
    return axios.put(...args)
  }

  static patch(...args) {
    return axios.patch(...args)
  }

  static delete(...args) {
    return axios.delete(...args)
  }

  static emit(msg) {
    io.emit(msg)
  }

  static _url(url) {
    // fix hardcoding with generated frontend psy module
    return `http://localhost:777/${url.replace(/^\//, '')}`
  }
}
