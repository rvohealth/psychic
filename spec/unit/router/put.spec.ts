import * as supertest from 'supertest'
import PsychicServer from '../../../src/server'

describe('PsychicRouter', () => {
  describe('#put', () => {
    it('can direct put requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.app).put('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
