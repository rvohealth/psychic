import { jest } from '@jest/globals'

global.eavesdrop = (...args) => {
  const cb = jest.fn(...args)
  cb.returning = cb.mockReturnValue
  return cb
}

global.posess = function(arg1, arg2, arg3) {
  const _spy = jest.spyOn(arg1, arg2, arg3)
  _spy.returning = _spy.mockReturnValue
  return _spy
}
