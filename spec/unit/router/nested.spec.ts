import * as supertest from 'supertest'
import HowlServer from '../../../src/server'

describe('HowlRouter', () => {
  describe('nested routes', () => {
    it('can direct nested routes to their respective controllers', async () => {
      const server = new HowlServer()
      await server.boot()

      const res = await supertest(server.app).get('/api-ping').expect(200)

      expect(res.body).toEqual('hellonestedworld')
    })

    it('can direct namespaced routes to their respective controllers', async () => {
      const server = new HowlServer()
      await server.boot()

      const res = await supertest(server.app).get('/api/v1/ping').expect(200)

      expect(res.body).toEqual('hellodoublenestedworld')
    })
  })
})
