import Dream from 'src/dream'
import config from 'src/config'

export default function buildPost() {
  class Post extends Dream {}

  const currentDreams = config.dreams
  posess(config, 'dreams', 'get').returning({
    ...currentDreams,
    'post': Post,
  })

  const currentSchema = config.schema
  posess(config, 'schema', 'get').returning({
    ...currentSchema,
    posts: {
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
      body: {
        type: 'string',
        name: 'body',
      },
    },
  })

  return Post
}
