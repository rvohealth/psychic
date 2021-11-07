import inflector from 'src/inflector'

describe('inflector#uncountable', () => {
  it ('adds uncountable rule when pluralizing', () => {
    expect('paper'.pluralize()).toEqual('papers')
    inflector.uncountable('paper')
    expect('paper'.pluralize()).toEqual('paper')
  })
})
