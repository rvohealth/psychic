import { jest } from '@jest/globals'
import Dream from 'src/dream'
import config from 'src/config'

describe('Dream.columns', () => {
  it ("returns the table's columns", async () => {
    class UserColumnsTest extends Dream {
      static table = 'fishman'
    }

    jest.spyOn(config, 'schema', 'get').mockReturnValue({
      fishman: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        email: {
          type: 'text',
          name: 'email',
        },
        password: {
          type: 'text',
          name: 'password',
        },
      }
    })

    expect(UserColumnsTest.columns).toBe(config.schema.fishman)
  })
})
