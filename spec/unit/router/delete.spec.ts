import * as supertest from 'supertest'
import HowlServer from '../../../src/server'

describe('HowlRouter', () => {
  describe('#delete', () => {
    it('can direct delete requests to controller', async () => {
      const server = new HowlServer()
      await server.boot()

      const res = await supertest(server.app).delete('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
