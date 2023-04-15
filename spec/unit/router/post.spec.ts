import * as supertest from 'supertest'
import HowlServer from '../../../src/server'

describe('HowlRouter', () => {
  describe('#post', () => {
    it('can direct post requests to controller', async () => {
      const server = new HowlServer()
      await server.boot()

      const res = await supertest(server.app).post('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
