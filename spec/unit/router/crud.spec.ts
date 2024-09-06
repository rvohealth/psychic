import PsychicServer from '../../../src/server'
import PsychicRouter from '../../../src/router'

describe('PsychicRouter', () => {
  describe('#crud', () => {
    let server: PsychicServer
    let router: PsychicRouter

    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.app, server.config)
    })

    it('correctly applies nested crud routes within resources', () => {
      expect(router.crud('get', '/doesnt-exist')).toThrow()

      // expect(router.routes).toEqual(
      //   expect.arrayContaining([
      //     {
      //       httpMethod: 'get',
      //       path: '/ping',
      //       controller: UsersController,
      //       action: 'ping',
      //     },
      //   ]),
      // )
    })
  })
})
