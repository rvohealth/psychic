import Dream from 'src/dream'
import config from 'src/config'

export default function buildTestUser() {
  class TestUser extends Dream {}

  const currentDreams = config.dreams
  posess(config, 'dreams', 'get').returning({
    ...currentDreams,
    'test_user': TestUser,
  })

  const currentSchema = config.schema
  posess(config, 'schema', 'get').returning({
    ...currentSchema,
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
