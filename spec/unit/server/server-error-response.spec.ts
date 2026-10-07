import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { MockInstance } from 'vitest'
import { PsychicServer } from '../../../src/package-exports/index.js'
import PsychicApp from '../../../src/psychic-app/index.js'

// PsychicApp is initialized afresh before every spec (spec/unit/setup/hooks.ts),
// so replacing its server:error hooks here lasts for one spec only
function replaceServerErrorHooks(...hooks: ((err: Error) => void | Promise<void>)[]) {
  const serverErrorHooks = PsychicApp.getOrFail().specialHooks.serverError
  serverErrorHooks.splice(0, serverErrorHooks.length, ...hooks)
}

describe('a visitor hits a route that raises a server error', () => {
  let logWithLevelSpy: MockInstance

  beforeEach(async () => {
    logWithLevelSpy = vi.spyOn(PsychicApp, 'logWithLevel')
    await request.init(PsychicServer)
  })

  // every error Koa's default error handler sees is logged a second time,
  // through the 'error' listener PsychicServer registers on the Koa app
  function errorLogCount() {
    return logWithLevelSpy.mock.calls.filter(([level]) => level === 'error').length
  }

  context('in an app with no server:error hooks', () => {
    beforeEach(() => {
      replaceServerErrorHooks()
    })

    context('thrown from a controller action', () => {
      it.each([
        ['this.internalServerError()', '/internal-server-error'],
        ['an HttpStatusInternalServerError carrying data', '/server-errors/psychic-500'],
        ['a plain Error', '/server-errors/non-http-error'],
        ['a frozen error', '/server-errors/frozen-error'],
      ])(
        '%s is answered with a 500 and an empty body, logged once, and never handed to Koa',
        async (_, path) => {
          const res = await request.get(path, 500)
          expect(res.text).toEqual('')
          expect(errorLogCount()).toEqual(1)
        },
      )

      it('a redirect psychic refuses as unsafe is answered with a 500 and an empty body, logged once, and never handed to Koa', async () => {
        const res = await request.get('/redirect-to-return-to', 500, {
          query: { returnTo: 'https://evil.example.com/' },
        })
        expect(res.headers['location']).toBeUndefined()
        expect(res.text).toEqual('')
        expect(errorLogCount()).toEqual(1)
      })

      it('keeps the headers set before the error, such as the secure default headers', async () => {
        const res = await request.get('/internal-server-error', 500)
        expect(res.headers['x-content-type-options']).toEqual('nosniff')
      })
    })
  })

  context('in development and test, a server:error hook that re-throws the error it was given', () => {
    beforeEach(() => {
      replaceServerErrorHooks(err => {
        throw err
      })
    })

    // the hook's error is re-thrown to Koa so specs see it; Koa cannot set the
    // status of these errors, so psychic hands Koa a plain Error wrapping them
    context.each([
      ['thrown from a controller action', '/server-errors'],
      ['thrown from middleware', '/middleware-server-errors'],
    ])('%s', (_, pathPrefix) => {
      it.each([
        ['an HttpStatusInternalServerError', 'psychic-500'],
        ['a frozen error', 'frozen-error'],
      ])("%s gets Koa's 500 instead of crashing Koa's error handler", async (_, scenario) => {
        const res = await request.get(`${pathPrefix}/${scenario}`, 500)
        expect(res.text).toEqual('Internal Server Error')
        // psychic's log line, and the hook's error reaching Koa's error handler
        expect(errorLogCount()).toEqual(2)
      })
    })
  })
})
