import { io } from 'socket.io-client'
import { wssUrl } from 'config/endpoints'

const socket = global.__psy_globals__socket =
  global.__psy_globals__socket || io(wssUrl)

export default socket
