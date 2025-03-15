import { agent as supertest } from 'supertest'
import PsychicServer from '../../../src/server/index.js'

describe('PsychicRouter', () => {
  describe('namespaced routes', () => {
    it('can direct namespaced routes to their respective controllers', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.expressApp).get('/api-ping').expect(200)

      expect(res.body).toEqual('hellonestedworld')
    })

    it('can direct namespaced routes to their respective controllers', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.expressApp).get('/api/v1/ping').expect(200)

      expect(res.body).toEqual('hellodoublenestedworld')
    })
  })
})
