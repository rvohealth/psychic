import Koa from 'koa'
import type { BodyParserOptions } from '../../psychic-app/index.js'

// errors thrown by the body parser's own parse step
const bodyParserErrors = new WeakSet<object>()

// errors thrown by an app's own detectJSON or onError callback, which the
// body parser calls inside its parse step
const callbackErrors = new WeakSet<object>()

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
 * cannot be told apart from it, and is a server error. That includes an
 * error thrown by the app's own `detectJSON` or `onError` callback (see
 * {@link excludeBodyParserCallbackErrors}), except the body parser's own
 * error re-thrown by `onError`.
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
 * through unmarked, as does an error thrown by the app's own `detectJSON` or
 * `onError` callback when the body parser was built from options passed
 * through {@link excludeBodyParserCallbackErrors}.
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
      if (!parsed && typeof err === 'object' && err !== null && !callbackErrors.has(err)) {
        bodyParserErrors.add(err)
      }
      throw err
    }
  }
}

/**
 * @internal
 *
 * Wraps the app's own `detectJSON` and `onError` callbacks, from
 * `psy.set('json', …)`, so that an error either throws is left unmarked by
 * {@link markBodyParserErrors}, although the body parser calls them inside
 * its parse step: such an error is the app's, not the body parser's own.
 * Keyed on the error itself, not on the callback that threw it, so the body
 * parser's own error, which `onError` is handed and may re-throw, is still
 * recognized. Adds no callback the app did not configure, since the body
 * parser swallows a parse error whenever it is given an `onError`.
 */
export function excludeBodyParserCallbackErrors(options: BodyParserOptions): BodyParserOptions {
  const { detectJSON, onError } = options

  return {
    ...options,

    ...(detectJSON && {
      detectJSON(ctx: Koa.Context) {
        try {
          return detectJSON(ctx)
        } catch (err) {
          recordCallbackError(err)
          throw err
        }
      },
    }),

    ...(onError && {
      onError(parseError: Error, ctx: Koa.Context) {
        try {
          onError(parseError, ctx)
        } catch (err) {
          // the error onError was handed, re-thrown, keeps its provenance:
          // the body parser's own, or a detectJSON callback's
          if (err !== parseError) recordCallbackError(err)
          throw err
        }
      },
    }),
  }
}

function recordCallbackError(err: unknown) {
  if (typeof err === 'object' && err !== null) callbackErrors.add(err)
}
