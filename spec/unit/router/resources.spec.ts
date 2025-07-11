import { agent as supertest } from 'supertest'
import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import PetsController from '../../../test-app/src/app/controllers/PetsController.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'
import { ControllerActionRouteConfig } from '../../../src/router/route-manager.js'

describe('PsychicRouter', () => {
  describe('resources', () => {
    describe('extra actions', () => {
      it('are directed to the same controller', async () => {
        const server = new PsychicServer()
        await server.boot()

        const res = await supertest(server.expressApp).get('/users/3/hello').expect(200)

        expect(res.body).toEqual('world 3')
      }, 15000)
    })

    describe('path generation', () => {
      let server: PsychicServer
      let router: PsychicRouter
      beforeEach(() => {
        server = new PsychicServer()
        router = new PsychicRouter(server.expressApp, server.config)
        vi.spyOn(server.expressApp, 'get')
        vi.spyOn(server.expressApp, 'post')
        vi.spyOn(server.expressApp, 'put')
        vi.spyOn(server.expressApp, 'patch')
        vi.spyOn(server.expressApp, 'delete')
      })

      it('renders create, index, show, update, and destroy routes for a resource', () => {
        router.resources('users')
        router.commit()
        expect(server.expressApp.get).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.expressApp.post).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.expressApp.get).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.expressApp.patch).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.expressApp.put).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.expressApp.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      })

      context('only is passed', () => {
        it('does not call methods that were omitted with only', () => {
          router.resources('users', { only: ['create', 'destroy'] })
          router.commit()
          expect(server.expressApp.post).toHaveBeenCalledWith('/users', expect.any(Function))
          expect(server.expressApp.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
          expect(server.expressApp.get).not.toHaveBeenCalled()
          expect(server.expressApp.patch).not.toHaveBeenCalled()
          expect(server.expressApp.put).not.toHaveBeenCalled()
        })
      })

      context('except is passed', () => {
        it('does not call methods that were omitted with except', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] })
          router.commit()
          expect(server.expressApp.get).not.toHaveBeenCalled()
          expect(server.expressApp.post).not.toHaveBeenCalled()
          expect(server.expressApp.patch).not.toHaveBeenCalled()
          expect(server.expressApp.put).not.toHaveBeenCalled()
          expect(server.expressApp.delete).not.toHaveBeenCalled()
        })
      })

      context('controller is passed', () => {
        it('uses the passed controller instead of assuming', () => {
          router.resources('users', { only: ['create'], controller: PetsController })
          router.commit()
          const route = router.routes[0]! as ControllerActionRouteConfig
          expect(route.controller).toEqual(PetsController)
          expect(route.action).toEqual('create')
        })
      })

      context('with nested resources', () => {
        it('successfully applies nested routes', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] }, r => {
            r.get('hello', UsersController, 'hello')
          })
          router.commit()
          expect(server.expressApp.get).toHaveBeenCalledWith('/users/:id/hello', expect.any(Function))
        })

        it('successfully applies nested resources', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] }, r => {
            r.resources('friends', { only: [] }, r => {
              r.get('hello', UsersController, 'hello')
            })
          })
          router.commit()

          expect(server.expressApp.get).toHaveBeenCalledWith(
            '/users/:userId/friends/:id/hello',
            expect.any(Function),
          )
        })
      })

      context('with nested resource', () => {
        it('successfully applies nested resource', () => {
          router.resources('user-settings', { only: [] }, r => {
            r.resource('friend', { only: [] }, r => {
              r.get('count', UsersController, 'hello')
            })
          })
          router.commit()

          expect(server.expressApp.get).toHaveBeenCalledWith(
            '/user-settings/:userSettingId/friend/count',
            expect.any(Function),
          )
        })
      })
    })
  })
})
