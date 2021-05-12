import Dream from 'src/dream'

describe('Dream.select', () => {
  it ('returns a new Query', async () => {
    class UserTest extends Dream {}
    const query = UserTest.select('email', 'name')
    expect(query.constructor.name).toBe('Query')
    expect(query.valueFor('select')).toEqual(['email', 'name'])
    expect(query.valueFor('from')).toEqual('user_tests')
  })
})
