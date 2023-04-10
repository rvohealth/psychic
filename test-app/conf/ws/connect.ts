import { Socket } from 'socket.io'

// this function is called each time a new socket connection is established.
// it is the equivilent of binding the following listener to socket io:
//
//     io.on('connection', (socket: Socket) => {
//     })
//
// for more information, see https://socket.io/docs/v3/client-socket-instance

export default async (socket: Socket) => {}
