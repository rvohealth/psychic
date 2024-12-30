import { describe as context } from '@jest/globals'
import PsychicRouter from '../../../src/router'
import PsychicServer from '../../../src/server'
import PetsController from '../../../test-app/src/app/controllers/PetsController'
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

    context('extra member actions', () => {
      it('include the :id param, not the named id param', () => {
        router.resources('pets', r => {
          r.post('hello', PetsController, 'hello')
        })
        router.commit()
        expect(router.routes).toEqual(
          expect.arrayContaining([
            {
              httpMethod: 'post',
              path: '/pets/:id/hello',
              controller: PetsController,
              action: 'hello',
            },
          ]),
        )
      })
    })

    context('extra member actions that appear after a nested resource', () => {
      it('include the :id param, not the named id param', () => {
        router.resources('pets', r => {
          r.resources('posts')
          r.post('hello', PetsController, 'hello')
        })
        router.commit()
        expect(router.routes).toEqual(
          expect.arrayContaining([
            {
              httpMethod: 'post',
              path: '/pets/:id/hello',
              controller: PetsController,
              action: 'hello',
            },
          ]),
        )
      })
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
