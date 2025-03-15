import { agent as supertest } from 'supertest'
import PsychicRouter from '../../../src/router.js'
import PsychicServer from '../../../src/server.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter', () => {
  describe('#put', () => {
    let server: PsychicServer
    let router: PsychicRouter

    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.expressApp, server.config)
    })

    describe('end-to-end specs', () => {
      it('can direct put requests to controller', async () => {
        const server = new PsychicServer()
        await server.boot()

        const res = await supertest(server.expressApp).put('/ping').expect(200)

        expect(res.body).toEqual('helloworld')
      })
    })

    it('correctly applies nested crud routes within resources', () => {
      router.put('/ping', UsersController, 'ping')
      router.commit()

      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'put',
            path: '/ping',
            controller: UsersController,
            action: 'ping',
          },
        ]),
      )
    })
  })
})
