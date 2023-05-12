import request from 'supertest'
import PsychicServer from '../../../src/server'
const server = new PsychicServer()

describe('a visitor attempts to hit an authed route (while being unauthenticated)', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('returns 404', async () => {
    await request.agent(server.app).get('/auth-ping').expect(401)
  })
})
