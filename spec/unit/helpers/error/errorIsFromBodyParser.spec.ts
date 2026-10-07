import Koa from 'koa'
import errorIsFromBodyParser, {
  excludeBodyParserCallbackErrors,
  markBodyParserErrors,
} from '../../../../src/helpers/error/errorIsFromBodyParser.js'
import { type BodyParserOptions } from '../../../../src/psychic-app/index.js'

async function errorThrownThrough(middleware: Koa.Middleware, next: Koa.Next = () => Promise.resolve()) {
  try {
    await middleware({} as Koa.Context, next)
  } catch (err) {
    return err
  }
  throw new Error('expected the middleware to throw')
}

describe('errorIsFromBodyParser', () => {
  it("is true for an error the body parser's parse step threw", async () => {
    const parseError = Object.assign(new SyntaxError('Unexpected token'), { status: 400 })
    const bodyParser = markBodyParserErrors(() => Promise.reject(parseError))

    expect(await errorThrownThrough(bodyParser)).toBe(parseError)
    expect(errorIsFromBodyParser(parseError)).toBe(true)
  })

  it('is false for an error thrown downstream of the body parser', async () => {
    const downstreamError = Object.assign(new SyntaxError('Unexpected token'), { status: 400 })
    const bodyParser = markBodyParserErrors((_ctx, next) => next())

    expect(await errorThrownThrough(bodyParser, () => Promise.reject(downstreamError))).toBe(downstreamError)
    expect(errorIsFromBodyParser(downstreamError)).toBe(false)
  })

  it('is false for a same-shaped error the body parser never saw', () => {
    expect(errorIsFromBodyParser(Object.assign(new SyntaxError('Unexpected token'), { status: 400 }))).toBe(
      false,
    )
    expect(errorIsFromBodyParser(null)).toBe(false)
    expect(errorIsFromBodyParser('not an error')).toBe(false)
  })
})

describe('excludeBodyParserCallbackErrors', () => {
  // calls the app's callbacks the way @koa/bodyparser does: detectJSON
  // inside the parse step, and onError with the error that step threw
  function bodyParserCalling(options: BodyParserOptions, parse: () => void = () => {}): Koa.Middleware {
    return async (ctx, next) => {
      try {
        options.detectJSON?.(ctx)
        parse()
      } catch (err) {
        if (!options.onError) throw err
        options.onError(err as Error, ctx)
      }
      await next()
    }
  }

  function callbackDependencyFailure() {
    return Object.assign(new Error('callback dependency failed'), { status: 401 })
  }

  function parseFailure() {
    return Object.assign(new SyntaxError('Unexpected token'), { status: 400 })
  }

  it("leaves an error thrown by the app's detectJSON unrecognized", async () => {
    const callbackError = callbackDependencyFailure()
    const options = excludeBodyParserCallbackErrors({
      detectJSON: () => {
        throw callbackError
      },
    })

    expect(await errorThrownThrough(markBodyParserErrors(bodyParserCalling(options)))).toBe(callbackError)
    expect(errorIsFromBodyParser(callbackError)).toBe(false)
  })

  it("leaves an error the app's onError throws in place of the parser's unrecognized", async () => {
    const parseError = parseFailure()
    const callbackError = callbackDependencyFailure()
    const options = excludeBodyParserCallbackErrors({
      onError: () => {
        throw callbackError
      },
    })
    const bodyParser = markBodyParserErrors(
      bodyParserCalling(options, () => {
        throw parseError
      }),
    )

    expect(await errorThrownThrough(bodyParser)).toBe(callbackError)
    expect(errorIsFromBodyParser(callbackError)).toBe(false)
  })

  it("still recognizes the parser's own error when the app's onError re-throws it", async () => {
    const parseError = parseFailure()
    const options = excludeBodyParserCallbackErrors({
      onError: err => {
        throw err
      },
    })
    const bodyParser = markBodyParserErrors(
      bodyParserCalling(options, () => {
        throw parseError
      }),
    )

    expect(await errorThrownThrough(bodyParser)).toBe(parseError)
    expect(errorIsFromBodyParser(parseError)).toBe(true)
  })

  it("leaves the detectJSON error unrecognized when the app's onError re-throws it", async () => {
    const callbackError = callbackDependencyFailure()
    const options = excludeBodyParserCallbackErrors({
      detectJSON: () => {
        throw callbackError
      },
      onError: err => {
        throw err
      },
    })

    expect(await errorThrownThrough(markBodyParserErrors(bodyParserCalling(options)))).toBe(callbackError)
    expect(errorIsFromBodyParser(callbackError)).toBe(false)
  })

  it("passes the app's callbacks their arguments and returns their results", () => {
    const ctx = {} as Koa.Context
    const parseError = parseFailure()
    const detectJSON = vi.fn(() => true)
    const onError = vi.fn()
    const options = excludeBodyParserCallbackErrors({ detectJSON, onError })

    expect(options.detectJSON!(ctx)).toBe(true)
    expect(detectJSON).toHaveBeenCalledWith(ctx)
    options.onError!(parseError, ctx)
    expect(onError).toHaveBeenCalledWith(parseError, ctx)
  })

  it('adds no callback the app did not configure', () => {
    // @koa/bodyparser swallows a parse error whenever an onError is given
    expect(excludeBodyParserCallbackErrors({ jsonLimit: '1mb' })).toStrictEqual({ jsonLimit: '1mb' })
  })
})
