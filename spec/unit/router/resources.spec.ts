import { agent as supertest } from 'supertest'
import PsychicRouter from '../../../src/router/index.js'
import { ControllerActionRouteConfig } from '../../../src/router/route-manager.js'
import PsychicServer from '../../../src/server/index.js'
import PetsController from '../../../test-app/src/app/controllers/PetsController.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

function committedRoutes(router: PsychicRouter) {
  router.commit()
  const routes = router.routes as ControllerActionRouteConfig[]
  return routes.map(r => ({ method: r.httpMethod, path: `/${r.path.replace(/^\//, '')}` }))
}

describe('PsychicRouter', () => {
  describe('resources', () => {
    describe('extra actions', () => {
      it('are directed to the same controller', async () => {
        const server = new PsychicServer()
        await server.boot()

        const res = await supertest(server.koaApp.callback()).get('/users/3/hello').expect(200)

        expect(res.body).toEqual('world 3')
      }, 15000)
    })

    describe('path generation', () => {
      let server: PsychicServer
      let router: PsychicRouter
      beforeEach(() => {
        server = new PsychicServer()
        router = new PsychicRouter(server.koaApp)
      })

      it('renders create, index, show, update, and destroy routes for a resource', () => {
        router.resources('users')
        const routeInfos = committedRoutes(router)
        expect(routeInfos).toContainEqual({ method: 'get', path: '/users' })
        expect(routeInfos).toContainEqual({ method: 'post', path: '/users' })
        expect(routeInfos).toContainEqual({ method: 'get', path: '/users/:id' })
        expect(routeInfos).toContainEqual({ method: 'patch', path: '/users/:id' })
        expect(routeInfos).toContainEqual({ method: 'put', path: '/users/:id' })
        expect(routeInfos).toContainEqual({ method: 'delete', path: '/users/:id' })
      })

      context('only is passed', () => {
        it('does not call methods that were omitted with only', () => {
          router.resources('users', { only: ['create', 'destroy'] })
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'post', path: '/users' })
          expect(routeInfos).toContainEqual({ method: 'delete', path: '/users/:id' })
          expect(routeInfos.filter(r => r.method === 'get')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'patch')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'put')).toHaveLength(0)
        })
      })

      context('except is passed', () => {
        it('does not call methods that were omitted with except', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] })
          const routeInfos = committedRoutes(router)
          expect(routeInfos.filter(r => r.method === 'get')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'post')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'patch')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'put')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'delete')).toHaveLength(0)
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
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'get', path: '/users/:id/hello' })
        })

        it('successfully applies nested resources', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] }, r => {
            r.resources('friends', { only: [] }, r => {
              r.get('hello', UsersController, 'hello')
            })
          })
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'get', path: '/users/:userId/friends/:id/hello' })
        })
      })

      context('with nested resource', () => {
        it('successfully applies nested resource', () => {
          router.resources('user-settings', { only: [] }, r => {
            r.resource('friend', { only: [] }, r => {
              r.get('count', UsersController, 'hello')
            })
          })
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'get', path: '/user-settings/:userSettingId/friend/count' })
        })
      })
    })
  })
})
