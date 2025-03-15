import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter', () => {
  describe('#collection', () => {
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

    it('does not enforce id param on subsequent routes', () => {
      router.resources('users', { only: [] }, () => {
        router.collection(r => {
          r.get('howyadoin', UsersController, 'howyadoin')
        })
      })

      router.commit()
      expect(server.expressApp.get).toHaveBeenCalledWith('/users/howyadoin', expect.any(Function))
      expect(server.expressApp.post).not.toHaveBeenCalled()
      expect(server.expressApp.put).not.toHaveBeenCalled()
      expect(server.expressApp.patch).not.toHaveBeenCalled()
      expect(server.expressApp.delete).not.toHaveBeenCalled()
    })
  })
})
