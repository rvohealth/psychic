export default function emit(io, to, path, data) {
  if (!to) throw `must pass required argument 'to'. i.e. auth:currentUser:$\{id}`
  if (!data) throw `must pass required argument 'data'. i.e. { fish: 10 }`

  let parts, key, id
  switch(typeof to) {
  case 'string':
    parts = to.split(':')
    switch(parts[0]) {
    case 'auth':
      key = parts[1]
      id = parts[2]

      for (const socketId in io.sockets.sockets) {
        const socket = io.sockets.sockets[socketId]
        // if wildcard, broadcast to all authenticated users
        if (id === '*' || socket.psy.auth[key] === id)
          socket.emit(path, data)
      }
      break

    default:
      throw `invalid mode passed to emit: ${parts[0]}`
    }
    break

  default:
    throw 'Must pass a string to to. something like auth:currentUser:${userId}'
  }
}
