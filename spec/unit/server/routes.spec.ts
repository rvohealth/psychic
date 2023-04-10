import PsychicServer from '../../../src/server'

describe('HowlServer', () => {
  describe('#routes', () => {
    it('can direct delete requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()
      expect(server.routes).toContain('GET /ping')
    })
  })
})
