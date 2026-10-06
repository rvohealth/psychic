import Koa from 'koa'
import HttpStatusInternalServerError from '../../../../src/error/http/InternalServerError.js'
import HttpStatusServiceUnavailable from '../../../../src/error/http/ServiceUnavailable.js'
import ApplicationController from './ApplicationController.js'

/**
 * Used by spec/unit/scenarios/response-statuses/deliberate-5xx.spec.ts, which
 * throws each of these errors both from a controller action (this controller)
 * and from middleware (test-app/src/conf/app.ts), so one rule is pinned on
 * both request paths.
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

    default:
      throw new Error(`unknown server error scenario: ${scenario}`)
  }
}

export default class ServerErrorsController extends ApplicationController {
  public throwScenario() {
    throwServerErrorScenario(this.ctx, this.castParam('scenario', 'string'))
  }
}
