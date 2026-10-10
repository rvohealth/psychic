import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import Koa from 'koa'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { agent as supertest } from 'supertest'
import { PsychicServer } from '../../../src/package-exports/index.js'
import errorBoundaryMiddleware from '../../../src/server/helpers/errorBoundaryMiddleware.js'

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

    it('responds 413 to a body over the size limit without calling server:error hooks (body parser 413)', async () => {
      await request.post('/ping', 413, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: { tooLarge: 'x'.repeat(60 * 1024) },
      })
      expect(serverErrorHookCallCount()).toEqual(0)
    })

    it('renders HttpError data as the response body without calling server:error hooks', async () => {
      const res = await request.get('/middleware-error-401', 401)
      expect(res.body).toEqual({ reason: 'custom middleware unauthorized' })
      expect(serverErrorHookCallCount()).toEqual(0)
    })

    it('renders a serializer passed as HttpError data', async () => {
      const res = await request.get('/middleware-error-409-with-serializer', 409)
      expect(res.body).toEqual({ conflictReason: 'taken' })
    })

    it('renders an array of serializers passed as HttpError data', async () => {
      const res = await request.get('/middleware-error-409-with-serializer-array', 409)
      expect(res.body).toEqual([{ conflictReason: 'taken' }])
    })
  })

  context('a deliberate 5xx HttpError thrown from middleware', () => {
    it('renders a serializer passed as HttpError data without calling server:error hooks', async () => {
      const res = await request.get('/middleware-error-503-with-serializer', 503)
      expect(res.body).toEqual({ conflictReason: 'taken' })
      expect(serverErrorHookCallCount()).toEqual(0)
    })
  })

  // the response can no longer be shaped, so the boundary hands the error to
  // Koa's default error handler, which marks it `headerSent` and only logs it
  // (Koa never ends such a response, so this is not a request-level spec)
  context('an error thrown from middleware after the response headers were sent', () => {
    function contextWithHeadersSent() {
      const app = new Koa()
      app.on('error', () => {})
      const req = new IncomingMessage(new Socket())
      const res = new ServerResponse(req)
      Object.defineProperty(res, 'headersSent', { value: true })
      return app.createContext(req, res)
    }

    async function errorTheBoundaryThrows(ctx: Koa.Context, err: Error) {
      try {
        await errorBoundaryMiddleware()(ctx, () => Promise.reject(err))
      } catch (thrown) {
        return thrown as Error
      }
      throw new Error('expected the error boundary to throw')
    }

    it("is handed to Koa's error handler unchanged when Koa can handle it", async () => {
      const ctx = contextWithHeadersSent()
      const err = new Error('thrown after the headers were sent')

      expect(await errorTheBoundaryThrows(ctx, err)).toBe(err)
    })

    it("wraps a frozen error, which Koa's error handler cannot mark, instead of crashing that handler", async () => {
      const ctx = contextWithHeadersSent()
      const err = Object.freeze(new Error('frozen'))

      const thrown = await errorTheBoundaryThrows(ctx, err)
      expect(thrown.cause).toBe(err)
      expect(() => ctx.onerror(thrown)).not.toThrow()
    })
  })
})
