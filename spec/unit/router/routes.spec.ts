import PsychicServer from '../../../src/server'
import PsychicRouter from '../../../src/router'
import ApiPetsController from '../../../test-app/app/controllers/Api/Users/PetsController'
import UsersController from '../../../test-app/app/controllers/UsersController'

describe('PsychicRouter', () => {
  describe('#routes', () => {
    let server: PsychicServer
    let router: PsychicRouter
    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.app, server.config)
    })

    it('correctly namespaces nested routes as members of the resource', () => {
      router.namespace('api', r => {
        r.resources('users', r => {
          r.resources('pets')
        })
      })
      router.commit()
      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'put',
            path: '/api/users/:userId/pets/:id',
            controller: ApiPetsController,
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
