import { agent as supertest } from 'supertest'
import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter', () => {
  describe('#get', () => {
    let server: PsychicServer
    let router: PsychicRouter

    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.expressApp)
    })

    describe('end-to-end specs', () => {
      it('can direct get requests to controller', async () => {
        await server.boot()

        const res = await supertest(server.expressApp).get('/ping').expect(200)

        expect(res.body).toEqual('helloworld')
      })
    })

    it('correctly applies nested crud routes within resources', () => {
      router.get('/ping', UsersController, 'ping')
      router.commit()

      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'get',
            path: '/ping',
            controller: UsersController,
            action: 'ping',
          },
        ]),
      )
    })
  })
})
