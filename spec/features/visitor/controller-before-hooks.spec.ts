import * as request from 'supertest'
import PsychicServer from '../../../src/server'
const server = new PsychicServer()

describe('controller before hooks', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('calls before actions before running a method', async () => {
    const response = await request.agent(server.app).get('/users-before-all-test').expect(200)
    expect(response.body).toEqual('before all action was called for all!')
  })
})
