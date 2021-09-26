import Dream from 'src/dream'
import config from 'src/config'

export default function buildMotherInLaw() {
  class MotherInLaw extends Dream {}

  const currentDreams = config.dreams
  posess(config, 'dreams', 'get').returning({
    ...currentDreams,
    'mother_in_law': MotherInLaw,
  })

  const currentSchema = config.schema
  posess(config, 'schema', 'get').returning({
    ...currentSchema,
    mother_in_laws: {
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

  return MotherInLaw
}


