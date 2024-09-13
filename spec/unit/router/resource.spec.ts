import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import PsychicRouter from '../../../src/router'
import PsychicServer from '../../../src/server'
import PetsController from '../../../test-app/src/app/controllers/PetsController'
import UsersController from '../../../test-app/src/app/controllers/UsersController'

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
        router = new PsychicRouter(server.app, server.config)
        jest.spyOn(server.app, 'get')
        jest.spyOn(server.app, 'post')
        jest.spyOn(server.app, 'put')
        jest.spyOn(server.app, 'patch')
        jest.spyOn(server.app, 'delete')
      })

      it('renders show, update, and destroy routes for a resource', () => {
        router.resource('users')
        router.commit()
        expect(server.app.post).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.app.get).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.app.patch).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.app.put).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.app.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      })

      context('only is passed', () => {
        it('does not call methods that were omitted with only', () => {
          router.resource('users', { only: ['show', 'destroy'] })
          router.commit()
          expect(server.app.get).toHaveBeenCalledWith('/users/:id', expect.any(Function))
          expect(server.app.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
          expect(server.app.post).not.toHaveBeenCalled()
          expect(server.app.patch).not.toHaveBeenCalled()
          expect(server.app.put).not.toHaveBeenCalled()
        })
      })

      context('except is passed', () => {
        it('does not call methods that were omitted with except', () => {
          router.resource('users', { except: ['show', 'update', 'destroy'] })
          router.commit()
          expect(server.app.get).not.toHaveBeenCalled()
          expect(server.app.patch).not.toHaveBeenCalled()
          expect(server.app.put).not.toHaveBeenCalled()
          expect(server.app.delete).not.toHaveBeenCalled()
          expect(server.app.post).toHaveBeenCalledWith('/users', expect.any(Function))
        })
      })

      context('controller is passed', () => {
        it('uses the passed controller instead of assuming', () => {
          router.resource('user', { only: ['update'], controller: PetsController })
          router.commit()
          expect(router.routes[0].controller).toEqual(PetsController)
          expect(router.routes[0].action).toEqual('update')
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
          expect(server.app.get).toHaveBeenCalledWith('/api/v1/users/hello', expect.any(Function))
        })

        it('successfully applies nested resource routes', () => {
          router.resource('users', { except: ['show', 'update', 'destroy', 'create'] }, r => {
            r.get('hello', UsersController, 'hello')
          })
          router.commit()
          expect(server.app.get).toHaveBeenCalledWith('/users/hello', expect.any(Function))
        })

        it('successfully applies double-nested resource resources', () => {
          router.resource('users', { except: ['show', 'update', 'destroy', 'create'] }, r => {
            r.resource('pets', { only: [] }, r => {
              r.get('count')
            })
          })
          router.commit()

          expect(server.app.get).toHaveBeenCalledWith('/users/pets/count', expect.any(Function))
        })
      })
    })
  })
})
