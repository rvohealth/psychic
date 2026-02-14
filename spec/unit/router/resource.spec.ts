import { specRequest as request } from '@rvoh/psychic-spec-helpers'
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
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  describe('resource', () => {
    describe('extra actions', () => {
      it('are directed to the same controller', async () => {
        const res = await request.get('/greeter/hello', 200)
        expect(res.body).toEqual('goodbye')
      })
    })
  })

  describe('path generation', () => {
    describe('resource', () => {
      let server: PsychicServer
      let router: PsychicRouter
      beforeEach(() => {
        server = new PsychicServer()
        router = new PsychicRouter(server.koaApp)
      })

      it('renders show, update, and destroy routes for a resource', () => {
        router.resource('users')
        const routeInfos = committedRoutes(router)
        expect(routeInfos).toContainEqual({ method: 'post', path: '/users' })
        expect(routeInfos).toContainEqual({ method: 'get', path: '/users' })
        expect(routeInfos).toContainEqual({ method: 'patch', path: '/users' })
        expect(routeInfos).toContainEqual({ method: 'put', path: '/users' })
        expect(routeInfos).toContainEqual({ method: 'delete', path: '/users' })
      })

      context('only is passed', () => {
        it('does not call methods that were omitted with only', () => {
          router.resource('users', { only: ['show', 'destroy'] })
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'get', path: '/users' })
          expect(routeInfos).toContainEqual({ method: 'delete', path: '/users' })
          expect(routeInfos.filter(r => r.method === 'post')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'patch')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'put')).toHaveLength(0)
        })
      })

      context('except is passed', () => {
        it('does not call methods that were omitted with except', () => {
          router.resource('users', { except: ['show', 'update', 'destroy'] })
          const routeInfos = committedRoutes(router)
          expect(routeInfos.filter(r => r.method === 'get')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'patch')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'put')).toHaveLength(0)
          expect(routeInfos.filter(r => r.method === 'delete')).toHaveLength(0)
          expect(routeInfos).toContainEqual({ method: 'post', path: '/users' })
        })
      })

      context('controller is passed', () => {
        it('uses the passed controller instead of assuming', () => {
          router.resource('user', { only: ['update'], controller: PetsController })
          router.commit()
          const route = router.routes[0]! as ControllerActionRouteConfig
          expect(route.controller).toEqual(PetsController)
          expect(route.action).toEqual('update')
        })
      })

      context('with nested resources', () => {
        it('successfully applies namespaced resource routes', () => {
          router.namespace('api', r => {
            r.namespace('v1', r => {
              r.resource('users', { except: ['show', 'update', 'destroy', 'create'] }, r => {
                r.get('hello', UsersController, 'hello')
              })
            })
          })
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'get', path: '/api/v1/users/hello' })
        })

        it('successfully applies nested resource routes', () => {
          router.resource('users', { except: ['show', 'update', 'destroy', 'create'] }, r => {
            r.get('hello', UsersController, 'hello')
          })
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'get', path: '/users/hello' })
        })

        it('successfully applies double-nested resource resources', () => {
          router.resource('users', { except: ['show', 'update', 'destroy', 'create'] }, r => {
            r.resource('pets', { only: [] }, r => {
              r.get('count')
            })
          })
          const routeInfos = committedRoutes(router)
          expect(routeInfos).toContainEqual({ method: 'get', path: '/users/pets/count' })
        })
      })
    })
  })
})
