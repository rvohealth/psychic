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
 * boundary answers such an error with its 4xx status as a handled response,
 * and a body that fails to decompress, whose error carries no status, with a
 * 400 (see {@link errorIsBodyDecompressionFailure}).
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

// the zlib error codes for a request body that is not valid gzip or deflate
// data: corrupt (Z_DATA_ERROR), cut short or empty (Z_BUF_ERROR), or needing
// a preset dictionary (Z_NEED_DICT)
const clientZlibErrorCodes = new Set(['Z_DATA_ERROR', 'Z_BUF_ERROR', 'Z_NEED_DICT'])

// the prefix of the brotli decoder's error codes for a request body that is
// not valid br data
const clientBrotliErrorCodePrefix = 'ERR__ERROR_FORMAT_'

/**
 * @internal
 *
 * Whether an error is the body parser's own failure to decompress a request
 * body sent with a gzip, deflate or br `Content-Encoding`, because the body
 * is not valid compressed data: the client's fault, which the error boundary
 * answers with a 400 as a handled response, like malformed JSON. The error
 * zlib throws for it carries no `status`, only a numeric `errno` and a
 * `code`.
 *
 * Provenance comes first (see {@link errorIsFromBodyParser}), so a
 * zlib-shaped error thrown anywhere else, including by the app's own
 * `onError` callback in place of the body parser's error, is not one. Among
 * the body parser's own errors, only the codes for an invalid body count; a
 * failure on the server's side, such as zlib running out of memory
 * (`Z_MEM_ERROR`) or the brotli decoder failing to allocate
 * (`ERR__ERROR_ALLOC_*`), is a server error.
 */
export function errorIsBodyDecompressionFailure(err: unknown): boolean {
  if (!errorIsFromBodyParser(err)) return false

  const { errno, code } = err as { errno?: unknown; code?: unknown }
  return (
    typeof errno === 'number' &&
    typeof code === 'string' &&
    (clientZlibErrorCodes.has(code) || code.startsWith(clientBrotliErrorCodePrefix))
  )
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
