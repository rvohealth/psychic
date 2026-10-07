import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { MockInstance } from 'vitest'
import { PsychicServer } from '../../../../src/package-exports/index.js'
import PsychicApp from '../../../../src/psychic-app/index.js'

// the scenarios are thrown by test-app/src/app/controllers/ServerErrorsController.ts
const requestPaths = [
  ['thrown from a controller action', (scenario: string) => `/server-errors/${scenario}`],
  ['thrown from middleware', (scenario: string) => `/middleware-server-errors/${scenario}`],
] as const

describe('a visitor hits a route that responds with a deliberate 5xx (501–510)', () => {
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
      context('a psychic HttpError with a 501–510 status', () => {
        it('responds with its status and data, without logging it or calling server:error hooks', async () => {
          const res = await request.get(pathFor('psychic-503'), 503)
          expect(res.body).toEqual({ reason: 'down for maintenance' })
          expectHandledResponse()
        })
      })

      context("an error from Koa's ctx.throw with a 501–510 status", () => {
        it.each([
          ['koa-501', 501],
          ['koa-503', 503],
          ['koa-510', 510],
        ])(
          '%s responds with its status and an empty body, without logging it or calling server:error hooks',
          async (scenario, status) => {
            const res = await request.get(pathFor(scenario), status)
            expect(res.text).toEqual('')
            expectHandledResponse()
          },
        )

        it('treats the wrapped form, ctx.throw(503, caughtError), the same way', async () => {
          const res = await request.get(pathFor('koa-503-wrapped'), 503)
          expect(res.text).toEqual('')
          expectHandledResponse()
        })

        it('never sends the error message or data, even when the error is marked expose', async () => {
          const res = await request.get(pathFor('koa-503-exposed-with-data'), 503)
          expect(res.text).toEqual('')
          expectHandledResponse()
        })

        it('applies the headers passed to ctx.throw', async () => {
          const res = await request.get(pathFor('koa-503-with-headers'), 503)
          expect(res.headers['retry-after']).toEqual('120')
          expect(res.text).toEqual('')
          expectHandledResponse()
        })

        it('does not send the headers a wrapped caught error carried', async () => {
          const res = await request.get(pathFor('koa-503-wrapped-with-own-headers'), 503, {
            headers: { Origin: 'http://localhost:3000' },
          })
          expect(res.headers['request-id']).toBeUndefined()
          expect(res.headers['access-control-allow-origin']).toEqual('http://localhost:3000')
          expect(res.headers['content-type']).not.toEqual('application/json')
          expect(res.text).toEqual('')
          expectHandledResponse()
        })
      })

      context('a server error', () => {
        it.each([
          'psychic-500',
          'koa-500',
          'koa-511',
          // an error that merely carries a status, e.g. an uncaught Google API client error
          'status-bearing-library-error',
          'non-http-error',
        ])('%s is logged and passed to server:error hooks exactly once', async scenario => {
          // the test-app's server:error hook answers 500
          const res = await request.get(pathFor(scenario), 500)
          expect(res.text).toEqual('')
          expect(errorLogCount()).toEqual(1)
          expect(serverErrorHookCallCount()).toEqual(1)
        })
      })
    })
  }
})
