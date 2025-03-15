import { PsychicApplication } from '../../../src.js'
import CannotFindInferredControllerFromProvidedNamespace from '../../../src/error/router/cannot-find-inferred-controller-from-provided-namespace.js'
import CannotInferControllerFromTopLevelRouteError from '../../../src/error/router/cannot-infer-controller-from-top-level-route.js'
import PsychicRouter from '../../../src/router.js'
import PsychicServer from '../../../src/server.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter', () => {
  describe('#crud', () => {
    let server: PsychicServer

    beforeEach(async () => {
      server = new PsychicServer()
      await server.boot()
    })

    it('correctly applies nested crud routes within resources', async () => {
      expect(await server.routes()).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'get',
            path: '/users/:id/ping',
            controller: UsersController,
            action: 'ping',
          },
        ]),
      )
    })

    it('raises an exception with a top level route that cannot be inferred', () => {
      const router = new PsychicRouter(server.expressApp, PsychicApplication.getOrFail())
      expect(() => router.crud('get', '/doesnt-exist')).toThrow(CannotInferControllerFromTopLevelRouteError)
    })

    it('raises an exception with a nested route that does not point to an existing controller', () => {
      const router = new PsychicRouter(server.expressApp, PsychicApplication.getOrFail())
      expect(() => {
        router.namespace('nonexistent-namespace', r => {
          r.resources('users', { only: [] }, r => {
            r.crud('get', '/doesnt-exist')
          })
        })
      }).toThrow(CannotFindInferredControllerFromProvidedNamespace)
    })
  })
})
