export function emit(io, to, path, data) {
  if (!to) throw `must pass required argument 'to'. i.e. auth:currentUser:$\{id}`
  if (!data) throw `must pass required argument 'data'. i.e. { fish: 10 }`

  let parts, id
  switch(typeof to) {
  case 'string':
    parts = to.split(':')
    switch(parts[0]) {
    case 'auth':
      id = parts[2]

      if (id === '*') io.emit(path, data)
      else io.to(to).emit(path, data)
      break

    default:
      throw `invalid mode passed to emit: ${parts[0]}`
    }
    break

  default:
    throw 'Must pass a string to to. something like auth:currentUser:${userId}'
  }
}
