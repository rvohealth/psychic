import pascalizeFileName from '../../../src/helpers/pascalizeFileName.js'

describe('pascalizeFileName', () => {
  it('pascalizes the route segments into a class name', () => {
    expect(pascalizeFileName('/api/v1/users')).toEqual('ApiV1Users')
  })

  it('handles compound route namespaces with hyphens', () => {
    expect(pascalizeFileName('/my-api/my-v1/my-users')).toEqual('MyApiMyV1MyUsers')
  })

  it('handles compound route namespaces with underscores', () => {
    expect(pascalizeFileName('/my_api/my_v1/my_users')).toEqual('MyApiMyV1MyUsers')
  })
})
