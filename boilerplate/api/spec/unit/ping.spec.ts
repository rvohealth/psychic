import { PsychicServer } from '@rvohealth/psychic'
import * as request from 'supertest'
const server = new PsychicServer()

describe('GET /ping', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('returns 200 response code', async () => {
    request.agent(server.app).get('/ping').expect(200)
  })
})
