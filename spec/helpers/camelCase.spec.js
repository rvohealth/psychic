import camelCase from 'src/helpers/camelCase'

describe ('camelCase', () => {
  it ('translates hyphen-case', () => {
    expect(camelCase('hello-world')).toEqual('helloWorld')
  })

  it ('translates snake_case', () => {
    expect(camelCase('hello_world')).toEqual('helloWorld')
  })

  it ('translates space case', () => {
    expect(camelCase('hello world')).toEqual('helloWorld')
  })

  it ('translates PascalCase', () => {
    expect(camelCase('HelloWorld')).toEqual('helloWorld')
  })
})

