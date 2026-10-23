import HttpStatusConflict from '../../../../src/error/http/Conflict.js'
import HttpStatusServiceUnavailable from '../../../../src/error/http/ServiceUnavailable.js'
import httpErrorHasBody from '../../../../src/helpers/error/httpErrorHasBody.js'

describe('httpErrorHasBody', () => {
  it('is false for an HttpError without data', () => {
    expect(httpErrorHasBody(new HttpStatusConflict())).toBe(false)
    expect(httpErrorHasBody(new HttpStatusConflict(undefined))).toBe(false)
  })

  it('is false for an HttpError whose data is null', () => {
    expect(httpErrorHasBody(new HttpStatusConflict(null))).toBe(false)
    expect(httpErrorHasBody(new HttpStatusServiceUnavailable(null))).toBe(false)
  })

  it.each([
    ['0', 0],
    ['false', false],
    ["''", ''],
    ['a string', 'name is taken'],
    ['an object', { reason: 'name is taken' }],
    ['an empty array', []],
  ])('is true for an HttpError whose data is %s', (_, data) => {
    expect(httpErrorHasBody(new HttpStatusConflict(data))).toBe(true)
  })
})
