import Dream from 'src/dream'
import config from 'src/config'

export default function buildComment() {
  class Comment extends Dream {}

  const currentDreams = config.dreams
  posess(config, 'dreams', 'get').returning({
    ...currentDreams,
    'comment': Comment,
  })

  const currentSchema = config.schema
  posess(config, 'schema', 'get').returning({
    ...currentSchema,
    comments: {
      id: {
        type: 'int',
        name: 'id',
        primary: true,
        unique: true
      },
      post_id: {
        type: 'int',
        name: 'post_id',
      },
      body: {
        type: 'string',
        name: 'body',
      },
    },
  })

  return Comment
}
