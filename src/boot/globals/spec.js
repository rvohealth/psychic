import { jest } from '@jest/globals'

global.eavesdrop = jest.fn

global.posess = function(arg1, arg2, arg3) {
  const _spy = jest.spyOn(arg1, arg2, arg3)
  _spy.returning = _spy.mockReturnValue
  return _spy
}
