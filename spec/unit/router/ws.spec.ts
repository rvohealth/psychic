import { io } from 'socket.io-client'
import request from 'supertest'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import { Socket } from 'socket.io'

const server = new PsychicServer()

describe('PsychicRouter', () => {
  beforeAll(async () => {
    await server.boot()
    await server.start(7111)
  })

  async function getUserToken() {
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    const res = await request
      .agent(server.app)
      .post('/login')
      .send({
        email: 'how@yadoin',
        password: 'howyadoin',
      })
      .expect(200)
    return res.body as string
  }

  async function waitForSocketResponse(socket: Socket) {
    return new Promise(accept => {
      socket.on('/ops/connection-success', () => {
        socket.emit('/api/v1/authed-ping')
      })

      socket.on('/api/v1/authed-ping-response', message => {
        accept(message)
      })
    })
  }

  describe('#ws', () => {
    it('can direct ws requests to io listeners', async () => {
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
      expect(message).toEqual({ message: 'Successfully pinged authenticated io listener' })
    })
  })
})
