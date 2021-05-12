import Dream from 'src/dream'

describe('Dream.table', () => {
  it ('returns the class name snake-cased', async () => {
    class UserTest extends Dream {}
    expect(UserTest.table).toBe('user_tests')
  })

  describe ('when table is explicitly set by class', () => {
    class UserTest2 extends Dream {
      static table = 'fishman'
    }

    it ('uses override', () => {
      expect(UserTest2.table).toBe('fishman')
    })
  })
})
