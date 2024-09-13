import PsychicRouter from '../../../src/router'
import PsychicServer from '../../../src/server'
import UsersPetsController from '../../../test-app/src/app/controllers/Users/PetsController'
import UsersController from '../../../test-app/src/app/controllers/UsersController'

describe('PsychicRouter', () => {
  describe('#routes', () => {
    let server: PsychicServer
    let router: PsychicRouter
    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.app, server.config)
    })

    it('correctly namespaces nested routes as members of the resource', () => {
      router.resources('users', r => {
        r.resources('pets')
      })
      router.commit()
      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'put',
            path: '/users/:userId/pets/:id',
            controller: UsersPetsController,
            action: 'update',
          },
        ]),
      )
    })

    it('correctly applies nested crud routes within resources', () => {
      router.resources('users', r => {
        r.get('pets', UsersController, 'ping')
      })
      router.commit()
      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'get',
            path: '/users/:id/pets',
            controller: UsersController,
            action: 'ping',
          },
        ]),
      )
    })
  })
})
