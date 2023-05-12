import supertest from 'supertest'
import PsychicServer from '../../../src/server'

describe('PsychicRouter', () => {
  describe('#delete', () => {
    it('can direct delete requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.app).delete('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
