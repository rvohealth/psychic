import Koa from 'koa'
import HttpStatusInternalServerError from '../../../../src/error/http/InternalServerError.js'
import HttpStatusServiceUnavailable from '../../../../src/error/http/ServiceUnavailable.js'
import ApplicationController from './ApplicationController.js'

/**
 * Used by spec/unit/scenarios/response-statuses/deliberate-5xx.spec.ts, which
 * throws each of these errors both from a controller action (this controller)
 * and from middleware (test-app/src/conf/app.ts), so one rule is pinned on
 * both request paths, and by spec/unit/server/server-error-response.spec.ts.
 */
export function throwServerErrorScenario(ctx: Koa.Context, scenario: string): never {
  switch (scenario) {
    // deliberate 5xx errors: a handled response
    case 'psychic-503':
      throw new HttpStatusServiceUnavailable({ reason: 'down for maintenance' })

    case 'koa-501':
      return ctx.throw(501)

    case 'koa-503':
      return ctx.throw(503)

    case 'koa-503-wrapped':
      return ctx.throw(503, new Error('upstream detail'))

    case 'koa-503-exposed-with-data':
      return ctx.throw(503, 'upstream detail', { expose: true, data: { upstream: 'detail' } })

    case 'koa-503-with-headers':
      return ctx.throw(503, { headers: { 'Retry-After': '120' } })

    case 'koa-503-wrapped-with-own-headers':
      // a caught SDK error that carries the upstream response's headers, as
      // stripe-node's StripeError does
      return ctx.throw(
        503,
        Object.assign(new Error('upstream'), {
          headers: {
            'access-control-allow-origin': '*',
            'content-type': 'application/json',
            'request-id': 'req_upstream',
          },
        }),
      )

    case 'koa-510':
      return ctx.throw(510)

    // server errors: logged and passed to server:error hooks
    case 'psychic-500':
      throw new HttpStatusInternalServerError({ diagnostics: 'server side only' })

    case 'koa-500':
      return ctx.throw(500)

    case 'koa-511':
      return ctx.throw(511)

    case 'status-bearing-library-error':
      // e.g. an uncaught Google API client error, which mirrors the upstream
      // status but is not an http-errors error
      throw Object.assign(new Error('upstream service unavailable'), { status: 503 })

    case 'non-http-error':
      throw new Error('something broke')

    case 'frozen-error': {
      // an error nothing can add properties to, such as a status
      const frozenError = new Error('frozen')
      Object.freeze(frozenError)
      throw frozenError
    }

    default:
      throw new Error(`unknown server error scenario: ${scenario}`)
  }
}

export default class ServerErrorsController extends ApplicationController {
  public throwScenario() {
    throwServerErrorScenario(this.ctx, this.castParam('scenario', 'string'))
  }

  // redirects to a target the request supplies, e.g. a `returnTo` param; psychic
  // refuses an unsafe target by throwing HttpStatusInternalServerError
  public redirectToReturnTo() {
    this.redirect(this.castParam('returnTo', 'string'))
  }

  // writes a success response, which is not sent until the action returns,
  // and then fails
  public okThenThrow() {
    this.ok({ secretSuccess: true })
    throw new Error('thrown after ok')
  }

  // sends the response headers, so the response can no longer be reshaped,
  // and then fails
  public sendHeadersThenThrow() {
    this.ctx.status = 202
    this.ctx.body = 'partial response'
    this.ctx.flushHeaders()
    throw new Error('thrown after the headers were sent')
  }
}
