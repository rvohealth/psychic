import { agent as supertest } from 'supertest'
import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter', () => {
  describe('#patch', () => {
    let server: PsychicServer
    let router: PsychicRouter

    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.expressApp)
    })

    describe('end-to-end specs', () => {
      it('can direct patch requests to controller', async () => {
        const server = new PsychicServer()
        await server.boot()

        const res = await supertest(server.expressApp).patch('/ping').expect(200)

        expect(res.body).toEqual('helloworld')
      })
    })

    it('correctly applies nested crud routes within resources', () => {
      router.patch('/ping', UsersController, 'ping')
      router.commit()

      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'patch',
            path: '/ping',
            controller: UsersController,
            action: 'ping',
          },
        ]),
      )
    })
  })
})
