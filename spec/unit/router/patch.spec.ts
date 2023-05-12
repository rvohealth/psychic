import supertest from 'supertest'
import PsychicServer from '../../../src/server'

describe('PsychicRouter', () => {
  describe('#patch', () => {
    it('can direct patch requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await supertest(server.app).patch('/ping').expect(200)

      expect(res.body).toEqual('helloworld')
    })
  })
})
