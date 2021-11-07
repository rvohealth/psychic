import axios from 'axios'
import io from 'psy/singletons/io'
import { serverUrl } from 'config/endpoints'

export default class Common {
  static async get(url, params, conf) {
    return await axios.get(this._url(url), {
      ...conf,
      params,
    })
  }

  static async post(url, data, conf) {
    return await axios.post(this._url(url), data, axiosConfig(conf))
  }

  static async put(url, data, conf) {
    return await axios.put(this._url(url), data, axiosConfig(conf))
  }

  static async patch(url, data, conf) {
    return await axios.patch(this._url(url), data, axiosConfig(conf))
  }

  static async delete(url, conf) {
    return await axios.delete(this._url(url), axiosConfig(conf))
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

function axiosConfig(overrides) {
  return {
    withCredentials: true,
    ...overrides,
  }
}
