import request from 'supertest'
import PsychicServer from '../../../../src/server'
const server = new PsychicServer()

describe('a visitor attempts to hit a route that will trigger a 409', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('returns 409', async () => {
    await request.agent(server.app).get('/conflict').expect(409)
  })
})
