import inflector from 'src/inflector'

describe('inflector#plural', () => {
  it ('adds plural rule when pluralizing', () => {
    expect('regex'.pluralize()).toEqual('regexes')
    inflector.plural(/gex/i, 'gexii')
    expect('regex'.pluralize()).toEqual('regexii')
  })
})
