import inflector from 'src/inflector'

describe('inflector#irregular', () => {
  it ('adds irregular rule when irregularizing', () => {
    expect('irregular'.pluralize()).toEqual('irregulars')
    inflector.irregular('irregular', 'regular')
    expect('irregular'.pluralize()).toEqual('regular')
  })
})
