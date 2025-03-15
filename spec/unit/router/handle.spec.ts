import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter#handle', () => {
  let server: PsychicServer
  let router: PsychicRouter
  const req = getMockReq({ body: {} }) as unknown as Request
  const res = getMockRes().res as unknown as Response
  beforeEach(async () => {
    server = new PsychicServer()
    await server.boot()
    router = new PsychicRouter(server.expressApp, server.config)
  })

  it('calls the matching method on a corresponding controller', async () => {
    vi.spyOn(UsersController.prototype, 'ping')
    router.get('users', UsersController, 'ping')
    await router.handle(UsersController, 'ping', { req, res })

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(UsersController.prototype.ping).toHaveBeenCalled()
  })
})
