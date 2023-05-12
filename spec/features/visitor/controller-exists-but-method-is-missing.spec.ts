import request from 'supertest'
import PsychicServer from '../../../src/server'
const server = new PsychicServer()

describe('a visitor attempts to hit an unauthed route', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('returns 501', async () => {
    await request.agent(server.app).get('/controller-exists-but-method-doesnt').expect(501)
  })
})
