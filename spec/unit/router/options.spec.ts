import { agent as supertest } from 'supertest'
import PsychicServer from '../../../src/server/index.js'

describe('PsychicRouter', () => {
  describe('#options', () => {
    it('can direct post requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()
      await supertest(server.expressApp).options('/ping').expect(204)
    })
  })
})
