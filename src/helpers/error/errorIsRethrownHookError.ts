import errorKoaCanHandle, { errorWrappedForKoa } from './errorKoaCanHandle.js'

// the errors the router has re-thrown to Koa for a failing server:error hook
const rethrownHookErrors = new WeakSet<object>()

/**
 * @internal
 *
 * Whether an error is the one the router re-threw, in development and test,
 * for a `server:error` hook that threw while it was answering a controller
 * action's server error (see {@link rethrownHookError}). The error boundary
 * passes it through to Koa untouched: the router has already logged and
 * answered the server error, and answering the hook's error as a new one
 * would run the hooks a second time for it.
 *
 * Recognized by the error itself, not by the request it was thrown on, so
 * any other error thrown on that request, e.g. by middleware around the
 * router once the router has answered the action's server error, is
 * answered by the error boundary like any other.
 */
export default function errorIsRethrownHookError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && rethrownHookErrors.has(err)
}

/**
 * @internal
 *
 * The error the router re-throws to Koa, in development and test, when a
 * `server:error` hook throws, so that specs see the hook's failure: the
 * hook's error when Koa's default error handler can respond to it, otherwise
 * a plain `Error` whose `cause` is the hook's error (see `errorKoaCanHandle`),
 * recorded so that {@link errorIsRethrownHookError} recognizes it. A thrown
 * primitive, which cannot be recorded, is wrapped as well; Koa would have
 * wrapped it itself.
 */
export function rethrownHookError(hookError: unknown): unknown {
  const handled = errorKoaCanHandle(hookError)
  const rethrown = typeof handled === 'object' && handled !== null ? handled : errorWrappedForKoa(hookError)

  rethrownHookErrors.add(rethrown)
  return rethrown
}
