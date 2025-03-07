import { agent as supertest } from 'supertest'
import PsychicServer from '../../../src/server'

describe('PsychicRouter', () => {
  describe('scoped routes', () => {
    it('can direct scoped routes to their respective controllers', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.expressApp).get('/scoped-things/testing-scopes').expect(200)

      expect(res.body).toEqual('helloscopedworld')
    })
  })
})
