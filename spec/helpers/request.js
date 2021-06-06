import axios from 'axios'
import io from 'socket.io-client'

export async function fetch(path) {
  const response = await axios.get(`http://localhost:888/${path}`, { withCredentials: true })
  return response
}

export async function post(path, data) {
  const response = await axios.post(`http://localhost:888/${path}`, data, { withCredentials: true })
  return response
}

export function emit(path, data) {
  const socket = io('localhost:889')
  const timeout = setTimeout(() => {
    throw `Failed to establish socket connection from spec layer`
  }, 5000)

  return new Promise(accept => {
    socket.on('connect', () => {
      socket.emit(path, data)
      clearTimeout(timeout)
      setTimeout(() => {
        accept()
      }, 20)
    })
  })
}
