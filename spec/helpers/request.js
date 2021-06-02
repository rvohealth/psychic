import axios from 'axios'

export async function fetch(path) {
  const response = await axios.get(`http://localhost:888/${path}`, { withCredentials: true })
  return response
}

export async function post(path, data) {
  const response = await axios.post(`http://localhost:888/${path}`, data, { withCredentials: true })
  return response
}
