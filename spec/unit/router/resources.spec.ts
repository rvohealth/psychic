import PsychicServer from '../../../src/server'
import PsychicRouter from '../../../src/router'

describe('PsychicRouter', () => {
  describe('resources', () => {
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

    it('renders create, index, show, update, and destroy routes for a resource', async () => {
      router.resources('users')
      expect(server.app.get).toHaveBeenCalledWith('/users', expect.any(Function))
      expect(server.app.post).toHaveBeenCalledWith('/users', expect.any(Function))
      expect(server.app.get).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      expect(server.app.patch).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      expect(server.app.put).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      expect(server.app.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
    })

    context('only is passed', () => {
      it('does not call methods that were omitted with only', () => {
        router.resources('users', { only: ['create'] })
        expect(server.app.post).toHaveBeenCalledWith('/users', expect.any(Function))
        expect(server.app.get).not.toHaveBeenCalled()
        expect(server.app.patch).not.toHaveBeenCalled()
        expect(server.app.put).not.toHaveBeenCalled()
        expect(server.app.delete).not.toHaveBeenCalled()
      })
    })

    context('except is passed', () => {
      it('does not call methods that were omitted with except', () => {
        router.resources('users', { except: ['index', 'show', 'create', 'update'] })
        expect(server.app.get).not.toHaveBeenCalled()
        expect(server.app.post).not.toHaveBeenCalled()
        expect(server.app.patch).not.toHaveBeenCalled()
        expect(server.app.put).not.toHaveBeenCalled()
        expect(server.app.delete).toHaveBeenCalledWith('/users/:id', expect.any(Function))
      })
    })

    context('with nested resources', () => {
      it('successfully applies nested routes', () => {
        router.resources('users', { except: ['index', 'show', 'create', 'update'] }, r => {
          r.get('hello', 'Users#hello')
        })
        expect(server.app.get).toHaveBeenCalledWith('/users/:id/hello', expect.any(Function))
      })

      it('successfully applies nested resources', () => {
        router.resources('users', { except: ['index', 'show', 'create', 'update'] }, r => {
          r.resources('friends', {}, r => {
            r.get('count', 'Friends#count')
          })
        })
        expect(server.app.get).toHaveBeenCalledWith('/users/:id/friends/:id/count', expect.any(Function))
      })
    })
  })
})
