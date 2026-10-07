import Koa from 'koa'

// errors thrown by the body parser's own parse step
const bodyParserErrors = new WeakSet<object>()

/**
 * @internal
 *
 * Whether an error was thrown by the body parser while parsing the request
 * body, e.g. co-body's error for malformed JSON (a `SyntaxError` with
 * `status: 400`) or raw-body's 413 for a body over the size limit. The error
 * boundary answers such an error with its 4xx status as a handled response.
 *
 * Recognized by where it was thrown (see {@link markBodyParserErrors}),
 * never by its shape: co-body's error for malformed JSON carries only a
 * `status` and the raw `body`, so a same-shaped error thrown anywhere else
 * cannot be told apart from it, and is a server error.
 */
export default function errorIsFromBodyParser(err: unknown): boolean {
  return typeof err === 'object' && err !== null && bodyParserErrors.has(err)
}

/**
 * @internal
 *
 * Wraps the body-parser middleware so that an error its parse step throws
 * is recognized by {@link errorIsFromBodyParser}. An error thrown downstream,
 * by the middleware and router the body parser hands the request to, passes
 * through unmarked.
 */
export function markBodyParserErrors(bodyParser: Koa.Middleware): Koa.Middleware {
  return async function psychicBodyParser(ctx, next) {
    let parsed = false

    try {
      await bodyParser(ctx, () => {
        parsed = true
        return next()
      })
    } catch (err) {
      if (!parsed && typeof err === 'object' && err !== null) bodyParserErrors.add(err)
      throw err
    }
  }
}
