import axios from 'axios'
import io from 'psy/singletons/io'

export default class Common {
  static get(url, params, axiosConfig) {
    return axios.get(this._url(url), {
      ...axiosConfig,
      params,
    })
  }

  static post(url, data, axiosConfig) {
    return axios.post(this._url(url), data, axiosConfig)
  }

  static put(url, data, axiosConfig) {
    return axios.put(this._url(url), data, axiosConfig)
  }

  static patch(url, data, axiosConfig) {
    return axios.patch(this._url(url), data, axiosConfig)
  }

  static delete(url, axiosConfig) {
    return axios.delete(this._url(url), axiosConfig)
  }

  static emit(path, msg) {
    io.emit(path, msg)
  }

  static on(path, cb) {
    io.on(path, cb)
  }

  static _url(url) {
    // fix hardcoding with generated frontend psy module
    return `http://localhost:777/${url.replace(/^\//, '')}`
  }
}
