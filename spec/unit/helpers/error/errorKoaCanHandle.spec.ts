import Koa from 'koa'
import HttpStatusInternalServerError from '../../../../src/error/http/InternalServerError.js'
import HttpStatusNotFound from '../../../../src/error/http/NotFound.js'
import errorKoaCanHandle from '../../../../src/helpers/error/errorKoaCanHandle.js'

// the error Koa's ctx.throw(status) throws
function koaThrown(status: number): unknown {
  try {
    new Koa().context.throw(status)
  } catch (err) {
    return err
  }
}

function expectWrapped(err: unknown) {
  const handled = errorKoaCanHandle(err)
  expect(handled).not.toBe(err)
  expect(handled).toBeInstanceOf(Error)
  expect((handled as Error).cause).toBe(err)
  // Koa's ctx.onerror assigns both of these
  expect(() => Object.assign(handled as Error, { status: 500, headerSent: true })).not.toThrow()
}

describe('errorKoaCanHandle', () => {
  context('an error Koa can respond to', () => {
    it('is returned unchanged', () => {
      const plainError = new Error('something broke')
      const statusBearingError = Object.assign(new Error('upstream'), { status: 503 })
      const koaError = koaThrown(404)

      expect(errorKoaCanHandle(plainError)).toBe(plainError)
      expect(errorKoaCanHandle(statusBearingError)).toBe(statusBearingError)
      expect(errorKoaCanHandle(koaError)).toBe(koaError)
    })

    it('is returned unchanged when its status is an accessor with a setter', () => {
      class ErrorWithStatusSetter extends Error {
        private _status = 500
        public get status() {
          return this._status
        }
        public set status(status: number) {
          this._status = status
        }
      }
      const err = new ErrorWithStatusSetter()

      expect(errorKoaCanHandle(err)).toBe(err)
    })
  })

  context('a value Koa wraps itself', () => {
    it('is returned unchanged', () => {
      const thrownObject = { status: 500 }

      expect(errorKoaCanHandle('something broke')).toEqual('something broke')
      expect(errorKoaCanHandle(thrownObject)).toBe(thrownObject)
    })
  })

  context('an error whose status Koa cannot set', () => {
    it('wraps a psychic HttpError, whose status is a getter', () => {
      expectWrapped(new HttpStatusInternalServerError({ diagnostics: 'server side only' }))
      expectWrapped(new HttpStatusNotFound())
    })

    it('wraps a frozen error', () => {
      expectWrapped(Object.freeze(new Error('frozen')))
    })

    it('wraps an error that cannot be extended', () => {
      expectWrapped(Object.preventExtensions(new Error('sealed')))
    })

    it('wraps an error whose status is read-only', () => {
      expectWrapped(Object.defineProperty(new Error('read-only status'), 'status', { value: 503 }))
    })

    it('wraps an error that inherits a read-only status', () => {
      class ErrorWithReadOnlyStatus extends Error {}
      Object.defineProperty(ErrorWithReadOnlyStatus.prototype, 'status', { value: 503 })

      expectWrapped(new ErrorWithReadOnlyStatus())
    })

    it('wraps an error whose headerSent cannot be set', () => {
      expectWrapped(Object.defineProperty(new Error('read-only headerSent'), 'headerSent', { value: false }))
    })
  })

  context('a thrown null or undefined, which Koa ignores without responding', () => {
    it('is wrapped', () => {
      expectWrapped(null)
      expectWrapped(undefined)
    })
  })
})
