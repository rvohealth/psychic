import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { agent as supertest } from 'supertest'
import { PsychicServer } from '../../../src/package-exports/index.js'

describe('PsychicServer error boundary', () => {
  beforeEach(async () => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    await request.init(PsychicServer)
  })

  function serverErrorHookCallCount() {
    return (process.env.__PSYCHIC_HOOKS_TEST_CACHE || '').split(',').filter(entry => entry === 'server:error')
      .length
  }

  context('an error thrown from middleware (never reaching the router)', () => {
    it('responds 500 and calls server:error hooks exactly once', async () => {
      await request.get('/middleware-error-500', 500)
      expect(serverErrorHookCallCount()).toEqual(1)
    })

    it('allows server:error hooks to shape the response', async () => {
      const res = await request.get('/middleware-error-shaped', 503)
      expect(res.body).toEqual({ shapedBy: 'server:error' })
      expect(serverErrorHookCallCount()).toEqual(1)
    })
  })

  context('an error thrown from a controller action', () => {
    it('still calls server:error hooks exactly once', async () => {
      await request.get('/internal-server-error', 500)
      expect(serverErrorHookCallCount()).toEqual(1)
    })
  })

  context('a 4xx-shaped middleware failure', () => {
    it('responds with the error status without calling server:error hooks (body parser 400)', async () => {
      const server = new PsychicServer()
      await server.boot()

      await supertest(server.koaApp.callback())
        .post('/ping')
        .set('content-type', 'application/json')
        .send('this is not json')
        .expect(400)

      expect(serverErrorHookCallCount()).toEqual(0)
    })

    it('renders HttpError data as the response body without calling server:error hooks', async () => {
      const res = await request.get('/middleware-error-401', 401)
      expect(res.body).toEqual({ reason: 'custom middleware unauthorized' })
      expect(serverErrorHookCallCount()).toEqual(0)
    })
  })
})
