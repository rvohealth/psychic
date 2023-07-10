import supertest from 'supertest'
import PsychicServer from '../../../src/server'

describe('PsychicRouter', () => {
  describe('namespaced routes', () => {
    it('can direct a route to a nested controller path', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.app).get('/api-ping').expect(200)

      expect(res.body).toEqual('hellonestedworld')
    })
  })
})
