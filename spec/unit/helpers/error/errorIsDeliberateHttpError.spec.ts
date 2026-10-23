import Koa from 'koa'
import HttpStatusBadGateway from '../../../../src/error/http/BadGateway.js'
import HttpStatusInternalServerError from '../../../../src/error/http/InternalServerError.js'
import HttpStatusNotFound from '../../../../src/error/http/NotFound.js'
import HttpStatusServiceUnavailable from '../../../../src/error/http/ServiceUnavailable.js'
import HttpStatusUnauthorized from '../../../../src/error/http/Unauthorized.js'
import errorIsDeliberateHttpError, {
  errorIsDeliberateKoaHttpError,
} from '../../../../src/helpers/error/errorIsDeliberateHttpError.js'

// the error Koa's ctx.throw(status, ...args) throws
function koaThrown(status: number, ...args: (Error | string)[]): unknown {
  try {
    new Koa().context.throw(status, ...args)
  } catch (err) {
    return err
  }
}

describe('errorIsDeliberateHttpError', () => {
  it('is true for a psychic HttpError with a 4xx status', () => {
    expect(errorIsDeliberateHttpError(new HttpStatusNotFound())).toBe(true)
    expect(errorIsDeliberateHttpError(new HttpStatusUnauthorized({ reason: 'expired' }))).toBe(true)
  })

  it('is true for a psychic HttpError with a 501–510 status', () => {
    expect(errorIsDeliberateHttpError(new HttpStatusServiceUnavailable())).toBe(true)
    expect(errorIsDeliberateHttpError(new HttpStatusBadGateway({ reason: 'upstream' }))).toBe(true)
  })

  it('is true for an error from ctx.throw with a 4xx status', () => {
    expect(errorIsDeliberateHttpError(koaThrown(400))).toBe(true)
    expect(errorIsDeliberateHttpError(koaThrown(404, 'widget 42 not found'))).toBe(true)
    expect(errorIsDeliberateHttpError(koaThrown(499))).toBe(true)
  })

  it('is true for an error from ctx.throw with a 501–510 status', () => {
    expect(errorIsDeliberateHttpError(koaThrown(501))).toBe(true)
    expect(errorIsDeliberateHttpError(koaThrown(503, 'down'))).toBe(true)
    expect(errorIsDeliberateHttpError(koaThrown(510))).toBe(true)
  })

  it('is true for the wrapped form, ctx.throw(status, caughtError)', () => {
    expect(errorIsDeliberateHttpError(koaThrown(404, new Error('upstream')))).toBe(true)
    expect(errorIsDeliberateHttpError(koaThrown(503, new Error('upstream')))).toBe(true)
  })

  it('is false for a 500', () => {
    expect(errorIsDeliberateHttpError(new HttpStatusInternalServerError())).toBe(false)
    expect(errorIsDeliberateHttpError(koaThrown(500))).toBe(false)
  })

  it('is false for a 5xx status outside 501–510', () => {
    expect(errorIsDeliberateHttpError(koaThrown(511))).toBe(false)
  })

  it('is false for an error that merely carries a 4xx or 5xx status (e.g. a Google API client error)', () => {
    expect(errorIsDeliberateHttpError(Object.assign(new Error('upstream'), { status: 401 }))).toBe(false)
    expect(errorIsDeliberateHttpError(Object.assign(new Error('upstream'), { status: 503 }))).toBe(false)
    expect(errorIsDeliberateHttpError(Object.assign(new Error('upstream'), { statusCode: 503 }))).toBe(false)
    expect(
      errorIsDeliberateHttpError(Object.assign(new Error('upstream'), { status: 404, statusCode: 404 })),
    ).toBe(false)
  })

  it("is false for an error shaped like the body parser's error for malformed JSON", () => {
    expect(
      errorIsDeliberateHttpError(Object.assign(new SyntaxError('Unexpected token'), { status: 400 })),
    ).toBe(false)
  })

  it('is false for a non-Error carrying the http-errors shape', () => {
    expect(errorIsDeliberateHttpError({ status: 404, statusCode: 404, expose: true })).toBe(false)
    expect(errorIsDeliberateHttpError({ status: 503, statusCode: 503, expose: false })).toBe(false)
  })

  it('is false for a non-HTTP error and for nullish values', () => {
    expect(errorIsDeliberateHttpError(new Error('boom'))).toBe(false)
    expect(errorIsDeliberateHttpError(null)).toBe(false)
    expect(errorIsDeliberateHttpError(undefined)).toBe(false)
  })
})

describe('errorIsDeliberateKoaHttpError', () => {
  it('is true for an error from ctx.throw with a 4xx or 501–510 status, wrapped or not', () => {
    expect(errorIsDeliberateKoaHttpError(koaThrown(404))).toBe(true)
    expect(errorIsDeliberateKoaHttpError(koaThrown(404, new Error('upstream')))).toBe(true)
    expect(errorIsDeliberateKoaHttpError(koaThrown(503))).toBe(true)
    expect(errorIsDeliberateKoaHttpError(koaThrown(503, new Error('upstream')))).toBe(true)
  })

  it('is false for a psychic HttpError', () => {
    expect(errorIsDeliberateKoaHttpError(new HttpStatusNotFound())).toBe(false)
    expect(errorIsDeliberateKoaHttpError(new HttpStatusServiceUnavailable())).toBe(false)
  })
})
