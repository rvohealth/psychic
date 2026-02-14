import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server/index.js'
import Comment from '../../../../test-app/src/app/models/Comment.js'
import Post from '../../../../test-app/src/app/models/Post.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('fast-json-stringify', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('can render an explicit serializer in response shape', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
    const post = await Post.create({ user, body: 'Hello' })
    const comment = await Comment.create({ post, body: 'World' })

    const results = await request.get(`/users/${user.id}/fast-json-stringify-with-serializer-ref`, 200)

    expect(results.body).toEqual({
      id: user.id,
      posts: [
        {
          id: post.id,
          body: 'Hello',
          comments: [
            {
              id: comment.id,
              body: 'World',
            },
          ],
        },
      ],
    })
  })
})
