import * as supertest from 'supertest'
import HowlServer from '../../../src/server'

describe('HowlRouter', () => {
  describe('#put', () => {
    it('can direct put requests to controller', async () => {
      const server = new HowlServer()
      await server.boot()

      const res = await supertest(server.app).put('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
