import supertest from 'supertest'
import PsychicServer from '../../../src/server'
import PsychicRouter from '../../../src/router'
import PetsController from '../../../test-app/app/controllers/PetsController'
import UsersController from '../../../test-app/app/controllers/UsersController'

describe('PsychicRouter', () => {
  describe('resources', () => {
    describe('extra actions', () => {
      it('are directed to the same controller', async () => {
        const server = new PsychicServer()
        await server.boot()

        const res = await supertest(server.app).get('/users/3/hello').expect(200)

        expect(res.body).toEqual('world 3')
      }, 15000)
    })

    describe('path generation', () => {
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

      it('renders create, index, show, update, and destroy routes for a resource', () => {
        router.resources('users')
        router.commit()
        expect(server.app.get).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.app.post).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.app.get).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.app.patch).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.app.put).toHaveBeenCalledWith('/users/:id', expect.any(Function))
        expect(server.app.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      })

      context('only is passed', () => {
        it('does not call methods that were omitted with only', () => {
          router.resources('users', { only: ['create', 'destroy'] })
          router.commit()
          expect(server.app.post).toHaveBeenCalledWith('/users', expect.any(Function))
          expect(server.app.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
          expect(server.app.get).not.toHaveBeenCalled()
          expect(server.app.patch).not.toHaveBeenCalled()
          expect(server.app.put).not.toHaveBeenCalled()
        })
      })

      context('except is passed', () => {
        it('does not call methods that were omitted with except', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] })
          router.commit()
          expect(server.app.get).not.toHaveBeenCalled()
          expect(server.app.post).not.toHaveBeenCalled()
          expect(server.app.patch).not.toHaveBeenCalled()
          expect(server.app.put).not.toHaveBeenCalled()
          expect(server.app.delete).not.toHaveBeenCalled()
        })
      })

      context('controller is passed', () => {
        it('uses the passed controller instead of assuming', () => {
          router.resources('users', { only: ['create'], controller: PetsController })
          router.commit()
          expect(router.routes[0].controller).toEqual(PetsController)
          expect(router.routes[0].action).toEqual('create')
        })
      })

      context('with nested resources', () => {
        it('successfully applies nested routes', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] }, r => {
            r.get('hello', UsersController, 'hello')
          })
          router.commit()
          expect(server.app.get).toHaveBeenCalledWith('/users/:id/hello', expect.any(Function))
        })

        it('successfully applies nested resources', () => {
          router.resources('users', { except: ['index', 'show', 'create', 'update', 'destroy'] }, r => {
            r.resources('friends', { only: [] }, r => {
              r.get('hello', UsersController, 'hello')
            })
          })
          router.commit()

          expect(server.app.get).toHaveBeenCalledWith(
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

          expect(server.app.get).toHaveBeenCalledWith(
            '/user-settings/:userSettingId/friend/count',
            expect.any(Function),
          )
        })
      })
    })
  })
})
