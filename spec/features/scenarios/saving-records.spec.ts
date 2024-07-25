import request from 'supertest'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import { createPsychicServer } from '../../../spec-helpers'

describe('a visitor attempts to save a record', () => {
  let server: PsychicServer
  beforeAll(async () => {
    server = await createPsychicServer()
  })

  it('returns 201', async () => {
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
      await request.agent(server.app).post('/failed-to-save-test').expect(422)
    })
  })

  context('with a response that throws', () => {
    beforeEach(() => {
      process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = '1'
    })

    afterEach(() => {
      process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = undefined
    })

    it('throws 500', async () => {
      await server.serveForRequestSpecs(async () => {
        await request.agent(server.app).post('/force-throw').expect(500)
      })
      expect(await User.count()).toEqual(0)
    })
  })

  context(
    'with a request that has invalid params, and controller is leveraging Params.for for validation',
    () => {
      it('throws 400', async () => {
        await server.serveForRequestSpecs(async () => {
          const response = await request
            .agent(server.app)
            .post('/users')
            .send({ user: { email: 123, password: 'howyadoin', name: 456 } })
            .expect(400)
          expect(response.body).toEqual({ errors: { email: ['expected string'], name: ['expected string'] } })
        })
        expect(await User.count()).toEqual(0)
      })
    },
  )
})
