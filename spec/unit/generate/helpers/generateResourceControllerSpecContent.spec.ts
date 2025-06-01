import generateResourceControllerSpecContent from '../../../../src/generate/helpers/generateResourceControllerSpecContent.js'

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
import { PsychicServer } from '@rvoh/psychic'
import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import Post from '../../../../src/app/models/Post.js'
import User from '../../../../src/app/models/User.js'
import createPost from '../../../factories/PostFactory.js'
import createUser from '../../../factories/UserFactory.js'
import addEndUserAuthHeader from '../../helpers/authentication.js'

describe('V1/PostsController', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await createUser()
  })

  describe('GET index', () => {
    const subject = async (expectedStatus: number = 200) => {
      return request.get('/posts', expectedStatus, {
        headers: await addEndUserAuthHeader(request, user, {}),
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
    const subject = async (post: Post, expectedStatus: number = 200) => {
      return request.get(\`/posts/\${post.id}\`, expectedStatus, {
        headers: await addEndUserAuthHeader(request, user, {}),
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
    const subject = async (data: UpdateableProperties<Post>, expectedStatus: number = 201) => {
      return request.post('/posts', expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, user, {}),
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
    const subject = async (post: Post, data: UpdateableProperties<Post>, expectedStatus: number = 204) => {
      return request.patch(\`/posts/\${post.id}\`, expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, user, {}),
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
        const post = await createPost()
        await subject(post, {
          body: 'Updated Post body',
        }, 404)

        await post.reload()
        expect(post.body).toEqual('The Post body')
      })
    })
  })

  describe('DELETE destroy', () => {
    const subject = async (post: Post, expectedStatus: number = 204) => {
      return request.delete(\`/posts/\${post.id}\`, expectedStatus, {
        headers: await addEndUserAuthHeader(request, user, {}),
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

  context('real world generator command that resulted in double-commas', () => {
    it('generates without double commas', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/Host/LocalizedTextsController',
        route: 'v1/host/localized-texts',
        fullyQualifiedModelName: 'LocalizedText',
        columnsWithTypes: [
          'localizable_type:enum:localized_types:Host,Place,Room',
          'localizable_id:bigint',
          'locale:enum:locales:en-US,es-ES',
          'title:string',
          'markdown:text',
          'deleted_at:datetime',
        ],
      })
      expect(res).toEqual(`\
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UpdateableProperties } from '@rvoh/dream'
import { PsychicServer } from '@rvoh/psychic'
import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import LocalizedText from '../../../../../src/app/models/LocalizedText.js'
import User from '../../../../../src/app/models/User.js'
import createLocalizedText from '../../../../factories/LocalizedTextFactory.js'
import createUser from '../../../../factories/UserFactory.js'
import addEndUserAuthHeader from '../../../helpers/authentication.js'

describe('V1/Host/LocalizedTextsController', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await createUser()
  })

  describe('GET index', () => {
    const subject = async (expectedStatus: number = 200) => {
      return request.get('/v1/host/localized-texts', expectedStatus, {
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the index of LocalizedTexts', async () => {
      const localizedText = await createLocalizedText({
        user,
        title: 'The LocalizedText title',
        markdown: 'The LocalizedText markdown',
      })
      const results = (await subject()).body

      expect(results).toEqual([
        expect.objectContaining({
          id: localizedText.id,
        }),
      ])
    })

    context('LocalizedTexts created by another User', () => {
      it('are omitted', async () => {
        await createLocalizedText()
        const results = (await subject()).body

        expect(results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const subject = async (localizedText: LocalizedText, expectedStatus: number = 200) => {
      return request.get(\`/v1/host/localized-texts/\${localizedText.id}\`, expectedStatus, {
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the specified LocalizedText', async () => {
      const localizedText = await createLocalizedText({
        user,
        title: 'The LocalizedText title',
        markdown: 'The LocalizedText markdown',
      })
      const results = (await subject(localizedText)).body

      expect(results).toEqual(
        expect.objectContaining({
          id: localizedText.id,
          title: 'The LocalizedText title',
          markdown: 'The LocalizedText markdown',
        }),
      )
    })

    context('LocalizedText created by another User', () => {
      it('is not found', async () => {
        const otherUserLocalizedText = await createLocalizedText()
        await subject(otherUserLocalizedText, 404)
      })
    })
  })

  describe('POST create', () => {
    const subject = async (data: UpdateableProperties<LocalizedText>, expectedStatus: number = 201) => {
      return request.post('/v1/host/localized-texts', expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('creates a LocalizedText for this User', async () => {
      const results = (await subject({
        title: 'The LocalizedText title',
        markdown: 'The LocalizedText markdown',
      })).body
      const localizedText = await LocalizedText.findOrFailBy({ userId: user.id })

      expect(results).toEqual(
        expect.objectContaining({
          id: localizedText.id,
          title: 'The LocalizedText title',
          markdown: 'The LocalizedText markdown',
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const subject = async (localizedText: LocalizedText, data: UpdateableProperties<LocalizedText>, expectedStatus: number = 204) => {
      return request.patch(\`/v1/host/localized-texts/\${localizedText.id}\`, expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('updates the LocalizedText', async () => {
      const localizedText = await createLocalizedText({
        user,
        title: 'The LocalizedText title',
        markdown: 'The LocalizedText markdown',
      })
      await subject(localizedText, {
        title: 'Updated LocalizedText title',
        markdown: 'Updated LocalizedText markdown',
      })

      await localizedText.reload()
      expect(localizedText.title).toEqual('Updated LocalizedText title')
      expect(localizedText.markdown).toEqual('Updated LocalizedText markdown')
    })

    context('a LocalizedText created by another User', () => {
      it('is not updated', async () => {
        const localizedText = await createLocalizedText()
        await subject(localizedText, {
          title: 'Updated LocalizedText title',
          markdown: 'Updated LocalizedText markdown',
        }, 404)

        await localizedText.reload()
        expect(localizedText.title).toEqual('The LocalizedText title')
        expect(localizedText.markdown).toEqual('The LocalizedText markdown')
      })
    })
  })

  describe('DELETE destroy', () => {
    const subject = async (localizedText: LocalizedText, expectedStatus: number = 204) => {
      return request.delete(\`/v1/host/localized-texts/\${localizedText.id}\`, expectedStatus, {
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('deletes the LocalizedText', async () => {
      const localizedText = await createLocalizedText({ user })
      await subject(localizedText)

      expect(await LocalizedText.find(localizedText.id)).toBeNull()
    })

    context('a LocalizedText created by another User', () => {
      it('is not deleted', async () => {
        const localizedText = await createLocalizedText()
        await subject(localizedText, 404)

        expect(await LocalizedText.find(localizedText.id)).toMatchDreamModel(localizedText)
      })
    })
  })
})
`)
    })
  })

  context('when resourceAttachedTo is specified', () => {
    it('generates specs with both user and attached model', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/Host/ReviewsController',
        route: 'v1/host/reviews',
        fullyQualifiedModelName: 'Review',
        columnsWithTypes: ['content:text', 'rating:integer'],
        resourceAttachedTo: 'Host',
      })
      expect(res).toContain('let user: User')
      expect(res).toContain('let host: Host')
      expect(res).toContain('user = await createUser()')
      expect(res).toContain('host = await createHost({ user })')
      expect(res).toContain('await createReview({')
      expect(res).toContain('host,')
      expect(res).toContain('headers: await addEndUserAuthHeader(request, user, {})')
    })
  })
})
