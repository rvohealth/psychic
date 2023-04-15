import * as supertest from 'supertest'
import HowlServer from '../../../src/server'

describe('HowlRouter', () => {
  describe('#patch', () => {
    it('can direct patch requests to controller', async () => {
      const server = new HowlServer()
      await server.boot()

      const res = await supertest(server.app).patch('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
