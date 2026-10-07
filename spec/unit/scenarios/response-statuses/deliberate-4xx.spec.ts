import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { MockInstance } from 'vitest'
import { PsychicServer } from '../../../../src/package-exports/index.js'
import PsychicApp from '../../../../src/psychic-app/index.js'

// the scenarios are thrown by test-app/src/app/controllers/ServerErrorsController.ts
const requestPaths = [
  ['thrown from a controller action', (scenario: string) => `/server-errors/${scenario}`],
  ['thrown from middleware', (scenario: string) => `/middleware-server-errors/${scenario}`],
] as const

describe('a visitor hits a route that responds with a deliberate 4xx', () => {
  let logWithLevelSpy: MockInstance

  beforeEach(async () => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    logWithLevelSpy = vi.spyOn(PsychicApp, 'logWithLevel')
    await request.init(PsychicServer)
  })

  function serverErrorHookCallCount() {
    return (process.env.__PSYCHIC_HOOKS_TEST_CACHE || '').split(',').filter(entry => entry === 'server:error')
      .length
  }

  function errorLogCount() {
    return logWithLevelSpy.mock.calls.filter(([level]) => level === 'error').length
  }

  function expectHandledResponse() {
    expect(errorLogCount()).toEqual(0)
    expect(serverErrorHookCallCount()).toEqual(0)
  }

  for (const [description, pathFor] of requestPaths) {
    context(description, () => {
      context('a psychic HttpError with a 4xx status', () => {
        it('responds with its status and data, without logging it or calling server:error hooks', async () => {
          const res = await request.get(pathFor('psychic-404'), 404)
          expect(res.body).toEqual({ reason: 'no such widget' })
          expectHandledResponse()
        })
      })

      context("an error from Koa's ctx.throw with a 4xx status", () => {
        it('responds with its status and an empty body, without logging it or calling server:error hooks', async () => {
          const res = await request.get(pathFor('koa-404'), 404)
          // the message passed to ctx.throw is never sent
          expect(res.text).toEqual('')
          expectHandledResponse()
        })

        it('treats the wrapped form, ctx.throw(404, caughtError), the same way', async () => {
          const res = await request.get(pathFor('koa-404-wrapped'), 404)
          expect(res.text).toEqual('')
          expectHandledResponse()
        })

        it('applies the headers passed to ctx.throw', async () => {
          const res = await request.get(pathFor('koa-401-with-headers'), 401)
          expect(res.headers['www-authenticate']).toEqual('Bearer')
          expect(res.text).toEqual('')
          expectHandledResponse()
        })
      })

      context('a server error carrying a 4xx status', () => {
        it.each([
          // e.g. an uncaught API client error mirroring an upstream 401
          'status-bearing-library-4xx-error',
          // the body parser's error for malformed JSON is a handled 400, but
          // only when the body parser threw it
          'body-parser-shaped-error',
        ])('%s is logged, passed to server:error hooks exactly once, and answered 500', async scenario => {
          // the test-app's server:error hook answers 500 with an empty body
          const res = await request.get(pathFor(scenario), 500)
          expect(res.text).toEqual('')
          expect(errorLogCount()).toEqual(1)
          expect(serverErrorHookCallCount()).toEqual(1)
        })
      })
    })
  }
})
