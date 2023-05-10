import * as request from 'supertest'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
const server = new PsychicServer()

describe('a visitor attempts to save a record', () => {
  beforeAll(async () => {
    await server.boot()
  })

  it('returns 200', async () => {
    await request
      .agent(server.app)
      .post('/users')
      .send({
        user: {
          email: 'how@yadoin',
          password: 'howyadoin',
        },
      })
      .expect(201)
    expect(await User.where({ email: 'how@yadoin' }).count()).toEqual(1)
  })

  context('with a record that is invalid at DB level', () => {
    it('does not save, throws 422', async () => {
      await request.agent(server.app).post('/failed-to-save-test').expect(500)
      expect(await User.count()).toEqual(0)
    })
  })
})
