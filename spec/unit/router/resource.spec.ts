import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import PetsController from '../../../test-app/src/app/controllers/PetsController.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'
import { ControllerActionRouteConfig } from '../../../src/router/route-manager.js'

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
        router = new PsychicRouter(server.expressApp, server.config)
        vi.spyOn(server.expressApp, 'get')
        vi.spyOn(server.expressApp, 'post')
        vi.spyOn(server.expressApp, 'put')
        vi.spyOn(server.expressApp, 'patch')
        vi.spyOn(server.expressApp, 'delete')
      })

      it('renders show, update, and destroy routes for a resource', () => {
        router.resource('users')
        router.commit()
        expect(server.expressApp.post).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.expressApp.get).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.expressApp.patch).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.expressApp.put).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.expressApp.delete).toHaveBeenCalledWith('/users', expect.any(Function))
      })

      context('only is passed', () => {
        it('does not call methods that were omitted with only', () => {
          router.resource('users', { only: ['show', 'destroy'] })
          router.commit()
          expect(server.expressApp.get).toHaveBeenCalledWith('/users', expect.any(Function))
          expect(server.expressApp.delete).toHaveBeenCalledWith('/users', expect.any(Function))
          expect(server.expressApp.post).not.toHaveBeenCalled()
          expect(server.expressApp.patch).not.toHaveBeenCalled()
          expect(server.expressApp.put).not.toHaveBeenCalled()
        })
      })

      context('except is passed', () => {
        it('does not call methods that were omitted with except', () => {
          router.resource('users', { except: ['show', 'update', 'destroy'] })
          router.commit()
          expect(server.expressApp.get).not.toHaveBeenCalled()
          expect(server.expressApp.patch).not.toHaveBeenCalled()
          expect(server.expressApp.put).not.toHaveBeenCalled()
          expect(server.expressApp.delete).not.toHaveBeenCalled()
          expect(server.expressApp.post).toHaveBeenCalledWith('/users', expect.any(Function))
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
          router.commit()
          expect(server.expressApp.get).toHaveBeenCalledWith('/api/v1/users/hello', expect.any(Function))
        })

        it('successfully applies nested resource routes', () => {
          router.resource('users', { except: ['show', 'update', 'destroy', 'create'] }, r => {
            r.get('hello', UsersController, 'hello')
          })
          router.commit()
          expect(server.expressApp.get).toHaveBeenCalledWith('/users/hello', expect.any(Function))
        })

        it('successfully applies double-nested resource resources', () => {
          router.resource('users', { except: ['show', 'update', 'destroy', 'create'] }, r => {
            r.resource('pets', { only: [] }, r => {
              r.get('count')
            })
          })
          router.commit()

          expect(server.expressApp.get).toHaveBeenCalledWith('/users/pets/count', expect.any(Function))
        })
      })
    })
  })
})
