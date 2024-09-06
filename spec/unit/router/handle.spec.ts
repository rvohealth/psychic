import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicRouter from '../../../src/router'
import PsychicServer from '../../../src/server'
import UsersController from '../../../test-app/src/app/controllers/UsersController'

describe('PsychicRouter#handle', () => {
  let server: PsychicServer
  let router: PsychicRouter
  const req = getMockReq({ body: {} })
  const res = getMockRes().res
  beforeEach(async () => {
    server = new PsychicServer()
    await server.boot()
    router = new PsychicRouter(server.app, server.config)
  })

  it('calls the matching method on a corresponding controller', async () => {
    jest.spyOn(UsersController.prototype, 'ping')
    router.get('users', UsersController, 'ping')
    await router.handle(UsersController, 'ping', { req, res })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(UsersController.prototype.ping).toHaveBeenCalled()
  })
})
