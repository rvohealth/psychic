import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicServer from '../../../src/server'
import PsychicRouter from '../../../src/router'
import UsersController from '../../../test-app/app/controllers/UsersController'

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
    router.get('users', 'Users#ping')
    await router.handle('Users#ping', { req, res })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(UsersController.prototype.ping).toHaveBeenCalled()
  })
})
