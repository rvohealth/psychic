import { Socket } from 'socket.io'
import { io } from 'socket.io-client'
import request from '../../../spec-helpers/spec-request'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import initializePsychicApplication from '../../../test-app/cli/helpers/initializePsychicApplication'

describe('user attempts to connect to websockets', () => {
  let server: PsychicServer
  beforeAll(async () => {
    await initializePsychicApplication()
    server = new PsychicServer()
    await server.boot()
    await server.start(7111)
  })

  beforeEach(async () => {
    await request.init()
  })

  async function getUserToken() {
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    const res = await request.post('/login', 200, { data: { email: 'how@yadoin', password: 'howyadoin' } })
    return res.body as string
  }

  async function waitForSocketResponse(socket: Socket) {
    return new Promise(accept => {
      socket.on('/ops/connection-success', message => {
        accept(message)
      })
    })
  }

  // This is an end-to-end test which proves the following:
  // 1. if a token is returned via some login pattern, and
  // 2. that token can be decoded and reversed to interpret the user's id
  // 3. then a simple websocket pattern in app.ts can enable this
  //    test to work:
  //
  //      psy.on('ws:start', io => {
  //        io.of('/').on('connection', async socket => {
  //          const token = socket.handshake.auth.token as string
  //          const userId = Encrypt.decode(token)
  //          const user = await User.find(userId)

  //          if (user) {
  //            // this automatically fires the /ops/connection-success message
  //            await Ws.register(socket, user)
  //          }
  //        })
  //      })

  it('allows connection', async () => {
    const token = await getUserToken()

    const socket = io(`http://localhost:7111`, {
      auth: {
        token,
      },
      withCredentials: true,
      transports: ['websocket'],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const message = await waitForSocketResponse(socket as any)
    expect(message).toEqual({ message: 'Successfully connected to psychic websockets' })
  })
})
