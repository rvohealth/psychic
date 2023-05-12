import supertest from 'supertest'
import PsychicServer from '../../../src/server'

describe('PsychicRouter', () => {
  describe('#post', () => {
    it('can direct post requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.app).post('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
