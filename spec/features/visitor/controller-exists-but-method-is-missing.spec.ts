import * as request from 'supertest'
import PsychicServer from '../../../src/server'
const server = new PsychicServer()

describe('a visitor attempts to hit an unauthed route', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('accepts the request', async () => {
    request.agent(server.app).get('/controller-exists-but-method-doesnt').expect(501)
  })
})
