import PsychicServer from '../../../src/server.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

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
