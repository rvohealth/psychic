import Dream from 'src/dream'
import config from 'src/config'

export default function buildSpouse() {
  class Spouse extends Dream {}

  const currentDreams = config.dreams
  posess(config, 'dreams', 'get').returning({
    ...currentDreams,
    'spouce': Spouse,
  })

  const currentSchema = config.schema
  posess(config, 'schema', 'get').returning({
    ...currentSchema,
    spouces: {
      id: {
        type: 'int',
        name: 'id',
        primary: true,
        unique: true
      },
      test_user_id: {
        type: 'int',
        name: 'test_user_id',
      },
      name: {
        type: 'string',
        name: 'name',
      },
    },
  })

  return Spouse
}

