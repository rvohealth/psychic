import Koa from 'koa'
import HttpStatusBadGateway from '../../../../src/error/http/BadGateway.js'
import HttpStatusInternalServerError from '../../../../src/error/http/InternalServerError.js'
import HttpStatusNotFound from '../../../../src/error/http/NotFound.js'
import HttpStatusServiceUnavailable from '../../../../src/error/http/ServiceUnavailable.js'
import errorIsDeliberateServerError, {
  errorIsDeliberateKoaServerError,
} from '../../../../src/helpers/error/errorIsDeliberateServerError.js'

// the error Koa's ctx.throw(status, ...args) throws
function koaThrown(status: number, ...args: (Error | string)[]): unknown {
  try {
    new Koa().context.throw(status, ...args)
  } catch (err) {
    return err
  }
}

describe('errorIsDeliberateServerError', () => {
  it('is true for a psychic HttpError with a 501–510 status', () => {
    expect(errorIsDeliberateServerError(new HttpStatusServiceUnavailable())).toBe(true)
    expect(errorIsDeliberateServerError(new HttpStatusBadGateway({ reason: 'upstream' }))).toBe(true)
  })

  it('is true for an error from ctx.throw with a 501–510 status', () => {
    expect(errorIsDeliberateServerError(koaThrown(501))).toBe(true)
    expect(errorIsDeliberateServerError(koaThrown(503, 'down'))).toBe(true)
    expect(errorIsDeliberateServerError(koaThrown(510))).toBe(true)
  })

  it('is true for the wrapped form, ctx.throw(503, caughtError)', () => {
    expect(errorIsDeliberateServerError(koaThrown(503, new Error('upstream')))).toBe(true)
  })

  it('is false for a 500', () => {
    expect(errorIsDeliberateServerError(new HttpStatusInternalServerError())).toBe(false)
    expect(errorIsDeliberateServerError(koaThrown(500))).toBe(false)
  })

  it('is false for a status outside 501–510', () => {
    expect(errorIsDeliberateServerError(koaThrown(511))).toBe(false)
    expect(errorIsDeliberateServerError(koaThrown(404))).toBe(false)
    expect(errorIsDeliberateServerError(new HttpStatusNotFound())).toBe(false)
  })

  it('is false for an error that merely carries a 501–510 status (e.g. a Google API client error)', () => {
    expect(errorIsDeliberateServerError(Object.assign(new Error('upstream'), { status: 503 }))).toBe(false)
    expect(errorIsDeliberateServerError(Object.assign(new Error('upstream'), { statusCode: 503 }))).toBe(
      false,
    )
    expect(
      errorIsDeliberateServerError(Object.assign(new Error('upstream'), { status: 503, statusCode: 503 })),
    ).toBe(false)
  })

  it('is false for a non-Error carrying the http-errors shape', () => {
    expect(errorIsDeliberateServerError({ status: 503, statusCode: 503, expose: false })).toBe(false)
  })

  it('is false for a non-HTTP error and for nullish values', () => {
    expect(errorIsDeliberateServerError(new Error('boom'))).toBe(false)
    expect(errorIsDeliberateServerError(null)).toBe(false)
    expect(errorIsDeliberateServerError(undefined)).toBe(false)
  })
})

describe('errorIsDeliberateKoaServerError', () => {
  it('is true for an error from ctx.throw with a 501–510 status, wrapped or not', () => {
    expect(errorIsDeliberateKoaServerError(koaThrown(503))).toBe(true)
    expect(errorIsDeliberateKoaServerError(koaThrown(503, new Error('upstream')))).toBe(true)
  })

  it('is false for a psychic HttpError', () => {
    expect(errorIsDeliberateKoaServerError(new HttpStatusServiceUnavailable())).toBe(false)
  })
})
