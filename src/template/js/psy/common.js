import axios from 'axios'

export default class Common {
  get(...args) {
    return axios.get(...args)
  }

  post(...args) {
    return axios.post(...args)
  }

  put(...args) {
    return axios.put(...args)
  }

  patch(...args) {
    return axios.patch(...args)
  }

  delete(...args) {
    return axios.delete(...args)
  }
}
