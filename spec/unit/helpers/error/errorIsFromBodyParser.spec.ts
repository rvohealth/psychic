import Koa from 'koa'
import errorIsFromBodyParser, {
  markBodyParserErrors,
} from '../../../../src/helpers/error/errorIsFromBodyParser.js'

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
