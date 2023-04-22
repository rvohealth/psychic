import PsychicServer from '../../../src/server'

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
            controllerActionString: 'users#ping',
          }),
        ])
      )
    })
  })
})
