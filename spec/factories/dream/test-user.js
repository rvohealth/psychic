import Dream from 'src/dream'
import config from 'src/config'

export default function buildTestUser() {
  class TestUser extends Dream {}

  posess(config, 'dreams', 'get').returning({
    'test_user': TestUser,
  })

  posess(config, 'schema', 'get').returning({
    test_users: {
      id: {
        type: 'int',
        name: 'id',
        primary: true,
        unique: true
      },
      email: {
        type: 'string',
        name: 'email',
      },
    },
  })

  return TestUser
}
