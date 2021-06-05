import axios from 'axios'

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

  static broadcast() {
    // fix hardcoding with generated frontend psy module
    const socket = new WebSocket('wss://localhost:778')
    socket.onOpen = event => {
      console.log('opened', event)
      socket.send('fishmans message')
    }
  }

  static _url(url) {
    // fix hardcoding with generated frontend psy module
    return `http://localhost:777/${url.replace(/^\//, '')}`
  }
}
