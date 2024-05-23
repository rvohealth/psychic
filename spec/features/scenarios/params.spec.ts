import request from 'supertest'
import PsychicServer from '../../../src/server'
import { createPsychicServer } from '../../../spec-helpers'

describe('hitting an endpoint that calls castParam', () => {
  let server: PsychicServer
  beforeAll(async () => {
    server = await createPsychicServer()
  })

  it('returns 204 with the param present', async () => {
    await request
      .agent(server.app)
      .post('/cast-param-test')
      .send({
        testString: 'hi',
      })
      .expect(204)
  })

  context('with the test field not present in params', () => {
    it('throws a 400', async () => {
      await request.agent(server.app).post('/cast-param-test').expect(400)
    })
  })
})
