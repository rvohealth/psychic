import PsychicRouter from '../../../src/router/index.js'
import { ControllerActionRouteConfig } from '../../../src/router/route-manager.js'
import PsychicServer from '../../../src/server/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter', () => {
  describe('#collection', () => {
    let server: PsychicServer
    let router: PsychicRouter
    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.koaApp)
    })

    it('does not enforce id param on subsequent routes', () => {
      router.resources('users', { only: [] }, () => {
        router.collection(r => {
          r.get('howyadoin', UsersController, 'howyadoin')
        })
      })

      const routes = router.routes as ControllerActionRouteConfig[]
      expect(routes).toHaveLength(1)
      expect(routes[0]!.httpMethod).toEqual('get')
      expect(routes[0]!.path).toEqual('/users/howyadoin')
    })
  })
})
