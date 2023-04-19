import * as supertest from 'supertest'
import PsychicServer from '../../../src/server'

describe('PsychicRouter', () => {
  describe('#get', () => {
    it('can direct get requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.app).get('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
