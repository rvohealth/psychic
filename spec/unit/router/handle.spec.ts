import { getMockReq, getMockRes } from '@jest-mock/express'
import HowlServer from '../../../src/server'
import HowlRouter from '../../../src/router'
import UsersController from '../../../test-app/app/controllers/users'

describe('HowlRouter#handle', () => {
  let server: HowlServer
  let router: HowlRouter
  const req = getMockReq({ body: {} })
  const res = getMockRes().res
  beforeEach(async () => {
    server = new HowlServer()
    await server.boot()
    router = new HowlRouter(server.app, server.config)
  })

  it('calls the matching method on a corresponding controller', async () => {
    jest.spyOn(UsersController.prototype, 'ping')
    router.get('users', 'users#ping')
    await router.handle('users#ping', { req, res })
    expect(UsersController.prototype.ping).toHaveBeenCalled()
  })
})
