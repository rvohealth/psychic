import { io } from 'socket.io-client'

const socket = global.__psy_globals__socket =
  global.__psy_globals__socket || io('localhost:778')

export default socket
