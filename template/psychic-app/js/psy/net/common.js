import axios from 'axios'
import io from 'psy/singletons/io'
import { serverUrl } from 'config/endpoints'

export default class Common {
  static async get(url, params, axiosConfig) {
    return await axios.get(this._url(url), {
      ...axiosConfig,
      params,
    })
  }

  static async post(url, data, axiosConfig) {
    console.log("DATA: ", this._url(url), data, axiosConfig)
    return await axios.post(this._url(url), data, axiosConfig)
  }

  static async put(url, data, axiosConfig) {
    return await axios.put(this._url(url), data, axiosConfig)
  }

  static async patch(url, data, axiosConfig) {
    return await axios.patch(this._url(url), data, axiosConfig)
  }

  static async delete(url, axiosConfig) {
    return await axios.delete(this._url(url), axiosConfig)
  }

  static emit(path, msg) {
    io.emit(path, msg)
  }

  static on(path, cb) {
    io.on(path, cb)
  }

  static _url(url) {
    // fix hardcoding with generated frontend psy module
    console.log("BUILDING URL:", `${serverUrl}/${url.replace(/^\//, '')}`)
    return `${serverUrl}/${url.replace(/^\//, '')}`
  }
}
