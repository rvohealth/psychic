import inflector from 'src/inflector'

describe('inflector#singular', () => {
  it ('adds singular rule when singularizing', () => {
    expect('singles'.singular()).toEqual('single')
    inflector.singular(/singles$/i, 'singular')
    expect('singles'.singular()).toEqual('singular')
  })
})
