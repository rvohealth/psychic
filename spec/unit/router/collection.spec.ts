import PsychicServer from '../../../src/server'
import PsychicRouter from '../../../src/router'

describe('PsychicRouter', () => {
  describe('#collection', () => {
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

    it('does not enforce id param on subsequent routes', () => {
      router.resources('users', { only: [] }, () => {
        router.collection(r => {
          r.get('howyadoin', 'Howyadoin#howyadoin')
        })
      })

      router.commit()
      expect(server.app.get).toHaveBeenCalledWith('/users/howyadoin', expect.any(Function))
      expect(server.app.post).not.toHaveBeenCalled()
      expect(server.app.put).not.toHaveBeenCalled()
      expect(server.app.patch).not.toHaveBeenCalled()
      expect(server.app.delete).not.toHaveBeenCalled()
    })
  })
})
