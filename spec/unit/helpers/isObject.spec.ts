import isObject from '../../../src/helpers/isObject.js'

// also in Dream
describe('isObject', () => {
  const subject = () => isObject(argument)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let argument: any

  it('is false for an array', () => {
    argument = []
    expect(subject()).toBe(false)
  })

  it('is true for an object', () => {
    argument = {}
    expect(subject()).toBe(true)
  })

  it('is false for a string', () => {
    argument = 'hello'
    expect(subject()).toBe(false)
  })

  it('is false for null', () => {
    argument = null
    expect(subject()).toBe(false)
  })

  it('is false for undefined', () => {
    argument = undefined
    expect(subject()).toBe(false)
  })
})
