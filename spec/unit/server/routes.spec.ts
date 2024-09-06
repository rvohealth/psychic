import PsychicServer from '../../../src/server'
import UsersController from '../../../test-app/app/controllers/UsersController'

describe('PsychicServer', () => {
  describe('#routes', () => {
    it('can direct delete requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()
      expect(await server.routes()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            httpMethod: 'get',
            path: 'ping',
            controller: UsersController,
            action: 'ping',
          }),
        ]),
      )
    })
  })
})
