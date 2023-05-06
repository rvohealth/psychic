import * as request from 'supertest'
import PsychicServer from '../../../src/server'
const server = new PsychicServer()

describe('a visitor attempts to hit a route at a nested resource', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('accepts the request', async () => {
    await request.agent(server.app).get('/api/v1/users').expect(200)
  })
})
