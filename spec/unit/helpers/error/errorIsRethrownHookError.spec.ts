import HttpStatusInternalServerError from '../../../../src/error/http/InternalServerError.js'
import errorIsRethrownHookError, {
  rethrownHookError,
} from '../../../../src/helpers/error/errorIsRethrownHookError.js'

describe('errorIsRethrownHookError', () => {
  it('is true for a hook error that Koa can handle, which is re-thrown as it is', () => {
    const hookError = new Error('the error tracker is unreachable')

    expect(rethrownHookError(hookError)).toBe(hookError)
    expect(errorIsRethrownHookError(hookError)).toBe(true)
  })

  it("is true for the wrapper re-thrown in place of a hook error whose status Koa's error handler cannot set", () => {
    const hookError = new HttpStatusInternalServerError()

    const rethrown = rethrownHookError(hookError)
    expect(rethrown).not.toBe(hookError)
    expect((rethrown as Error).cause).toBe(hookError)
    expect(errorIsRethrownHookError(rethrown)).toBe(true)
    expect(errorIsRethrownHookError(hookError)).toBe(false)
  })

  it('is true for the wrapper re-thrown in place of a thrown primitive, which cannot be recognized itself', () => {
    const rethrown = rethrownHookError('the error tracker is unreachable')

    expect(rethrown).toBeInstanceOf(Error)
    expect((rethrown as Error).cause).toEqual('the error tracker is unreachable')
    expect(errorIsRethrownHookError(rethrown)).toBe(true)
  })

  it('is false for any other error, such as one middleware threw on the same request', () => {
    expect(errorIsRethrownHookError(new Error('thrown by middleware'))).toBe(false)
    expect(errorIsRethrownHookError(null)).toBe(false)
    expect(errorIsRethrownHookError('the error tracker is unreachable')).toBe(false)
  })
})
