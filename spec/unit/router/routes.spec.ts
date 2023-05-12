import PsychicServer from '../../../src/server'
import PsychicRouter from '../../../src/router'

describe('PsychicRouter', () => {
  describe('#routes', () => {
    let server: PsychicServer
    let router: PsychicRouter
    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.app, server.config)
    })

    it('correctly namespaces nested routes as members of the resource', async () => {
      router.resources('users', r => {
        r.resources('pets')
      })
      router.commit()
      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'put',
            path: '/users/:user_id/pets/:id',
            controllerActionString: 'Users/Pets#update',
          },
        ])
      )
    })

    it('correctly applies nested crud routes within resources', async () => {
      router.resources('users', r => {
        r.get('pets', 'Users#pets')
      })
      router.commit()
      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'get',
            path: '/users/:id/pets',
            controllerActionString: 'Users#pets',
          },
        ])
      )
    })
  })
})
