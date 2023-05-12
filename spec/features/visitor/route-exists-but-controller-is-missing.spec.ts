import request from 'supertest'
import PsychicServer from '../../../src/server'
const server = new PsychicServer()

describe('a visitor attempts to hit an unauthed route', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('returns 501', async () => {
    await request.agent(server.app).get('/route-exists-but-controller-doesnt').expect(501)
  })
})
