import Dream from 'src/dream'

describe('Dream.where', () => {
  it ('returns a new Query, forcing a wildcard select statement', async () => {
    class UserTest extends Dream {}
    const query = UserTest.where({ email: 'fishman' })
    expect(query.constructor.name).toBe('Query')
    expect(query.valueFor('select')).toEqual(['*'])
    expect(query.valueFor('where')).toEqual({ email: 'fishman' })
    expect(query.valueFor('from')).toEqual('user_tests')
  })
})
