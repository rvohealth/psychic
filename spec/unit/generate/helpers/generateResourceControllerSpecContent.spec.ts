import generateResourceControllerSpecContent from '../../../../src/generate/helpers/generateResourceControllerSpecContent'

describe('generateResourceControllerSpecContent', () => {
  it('generates a useful resource controller spec', () => {
    const res = generateResourceControllerSpecContent({
      fullyQualifiedControllerName: 'V1/PostsController',
      route: 'posts',
      fullyQualifiedModelName: 'Post',
      columnsWithTypes: ['body:text', 'rating:decimal:3,2', 'User:belongs_to'],
    })
    expect(res).toEqual(`\
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UpdateableProperties } from '@rvoh/dream'
import { PsychicServer } from '@rvohealth/psychic'
import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import Post from '../../../../src/app/models/Post'
import User from '../../../../src/app/models/User'
import createPost from '../../../factories/PostFactory'
import createUser from '../../../factories/UserFactory'
import { addEndUserAuthHeader } from '../../helpers/authentication'

describe('V1/PostsController', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await createUser()
  })

  describe('GET index', () => {
    function subject(expectedStatus: number = 200) {
      return request.get('/posts', expectedStatus, {
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the index of Posts', async () => {
      const post = await createPost({
        user,
        body: 'The Post body',
      })
      const results = (await subject()).body

      expect(results).toEqual([
        expect.objectContaining({
          id: post.id,
        }),
      ])
    })

    context('Posts created by another User', () => {
      it('are omitted', async () => {
        await createPost()
        const results = (await subject()).body

        expect(results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    function subject(post: Post, expectedStatus: number = 200) {
      return request.get(\`/posts/\${post.id}\`, expectedStatus, {
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({
        user,
        body: 'The Post body',
      })
      const results = (await subject(post)).body

      expect(results).toEqual(
        expect.objectContaining({
          id: post.id,
          body: 'The Post body',
        }),
      )
    })

    context('Post created by another User', () => {
      it('is not found', async () => {
        const otherUserPost = await createPost()
        await subject(otherUserPost, 404)
      })
    })
  })

  describe('POST create', () => {
    function subject(data: UpdateableProperties<Post>, expectedStatus: number = 201) {
      return request.post('/posts', expectedStatus, {
        data,
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('creates a Post for this User', async () => {
      const results = (await subject({
        body: 'The Post body',
      })).body
      const post = await Post.findOrFailBy({ userId: user.id })

      expect(results).toEqual(
        expect.objectContaining({
          id: post.id,
          body: 'The Post body',
        }),
      )
    })
  })

  describe('PATCH update', () => {
    function subject(post: Post, data: UpdateableProperties<Post>, expectedStatus: number = 204) {
      return request.patch(\`/posts/\${post.id}\`, expectedStatus, {
        data,
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('updates the Post', async () => {
      const post = await createPost({
        user,
        body: 'The Post body',
      })
      await subject(post, {
        body: 'Updated Post body',
      })

      await post.reload()
      expect(post.body).toEqual('Updated Post body')
    })

    context('a Post created by another User', () => {
      it('is not updated', async () => {
        const post = await createPost({
          body: 'The Post body',
        })
        await subject(post, {
          body: 'Updated Post body',
        }, 404)

        await post.reload()
        expect(post.body).toEqual('The Post body')
      })
    })
  })

  describe('DELETE destroy', () => {
    function subject(post: Post, expectedStatus: number = 204) {
      return request.delete(\`/posts/\${post.id}\`, expectedStatus, {
        headers: addEndUserAuthHeader(request, user, {}),
      })
    }

    it('deletes the Post', async () => {
      const post = await createPost({ user })
      await subject(post)

      expect(await Post.find(post.id)).toBeNull()
    })

    context('a Post created by another User', () => {
      it('is not deleted', async () => {
        const post = await createPost()
        await subject(post, 404)

        expect(await Post.find(post.id)).toMatchDreamModel(post)
      })
    })
  })
})
`)
  })
})
