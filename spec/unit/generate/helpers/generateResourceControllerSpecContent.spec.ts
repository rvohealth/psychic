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
import { UpdateableProperties } from '@rvoh/dream'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import Post from '../../../../src/app/models/Post.js'
import User from '../../../../src/app/models/User.js'
import { validationOpenapiPaths } from '../../../../src/types/openapi/validation.openapi.js'
import createPost from '../../../factories/PostFactory.js'
import createUser from '../../../factories/UserFactory.js'
import addEndUserAuthHeader from '../../helpers/authentication.js'

const request = new OpenapiSpecRequest<validationOpenapiPaths>()

describe('V1/PostsController', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await createUser()
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/posts', expectedStatus, {
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the index of Posts', async () => {
      const post = await createPost({
        user,
        body: 'The Post body',
      })
      const { body } = await subject(200)

      expect(body).toEqual([
        expect.objectContaining({
          id: post.id,
        }),
      ])
    })

    context('Posts created by another User', () => {
      it('are omitted', async () => {
        await createPost()
        const { body } = await subject(200)

        expect(body).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.get('/posts/{id}', expectedStatus, {
        id: post.id,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({
        user,
        body: 'The Post body',
      })
      const { body } = await subject(post, 200)

      expect(body).toEqual(
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
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<Post>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/posts', expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('creates a Post for this User', async () => {
      const { body } = await subject({
        body: 'The Post body',
      }, 201)
      const post = await Post.findOrFailBy({ userId: user.id })

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          body: 'The Post body',
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(
      post: Post,
      data: UpdateableProperties<Post>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/posts/{id}', expectedStatus, {
        id: post.id,
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
      }, 204)

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
    const subject = async <StatusCode extends 204 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.delete('/posts/{id}', expectedStatus, {
        id: post.id,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('deletes the Post', async () => {
      const post = await createPost({ user })
      await subject(post, 204)

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
import { UpdateableProperties } from '@rvoh/dream'
import { PsychicServer } from '@rvoh/psychic'
import { OpenapiSpecRequest } from '@rvoh/psychic-spec-helpers'
import LocalizedText from '../../../../../src/app/models/LocalizedText.js'
import User from '../../../../../src/app/models/User.js'
import { validationOpenapiPaths } from '../../../../src/types/openapi/validation.openapi.js'
import createLocalizedText from '../../../../factories/LocalizedTextFactory.js'
import createUser from '../../../../factories/UserFactory.js'
import addEndUserAuthHeader from '../../../helpers/authentication.js'

const request = new OpenapiSpecRequest<validationOpenapiPaths>()

describe('V1/Host/LocalizedTextsController', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await createUser()
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
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
      const { body } = await subject(200)

      expect(body).toEqual([
        expect.objectContaining({
          id: localizedText.id,
        }),
      ])
    })

    context('LocalizedTexts created by another User', () => {
      it('are omitted', async () => {
        await createLocalizedText()
        const { body } = await subject(200)

        expect(body).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(localizedText: LocalizedText, expectedStatus: StatusCode) => {
      return request.get('/v1/host/localized-texts/{id}', expectedStatus, {
        id: localizedText.id,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('returns the specified LocalizedText', async () => {
      const localizedText = await createLocalizedText({
        user,
        title: 'The LocalizedText title',
        markdown: 'The LocalizedText markdown',
      })
      const { body } = await subject(localizedText, 200)

      expect(body).toEqual(
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
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<LocalizedText>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/host/localized-texts', expectedStatus, {
        data,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('creates a LocalizedText for this User', async () => {
      const { body } = await subject({
        title: 'The LocalizedText title',
        markdown: 'The LocalizedText markdown',
      }, 201)
      const localizedText = await LocalizedText.findOrFailBy({ userId: user.id })

      expect(body).toEqual(
        expect.objectContaining({
          id: localizedText.id,
          title: 'The LocalizedText title',
          markdown: 'The LocalizedText markdown',
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(
      localizedText: LocalizedText,
      data: UpdateableProperties<LocalizedText>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/v1/host/localized-texts/{id}', expectedStatus, {
        id: localizedText.id,
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
      }, 204)

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
    const subject = async <StatusCode extends 204 | 400 | 404>(localizedText: LocalizedText, expectedStatus: StatusCode) => {
      return request.delete('/v1/host/localized-texts/{id}', expectedStatus, {
        id: localizedText.id,
        headers: await addEndUserAuthHeader(request, user, {}),
      })
    }

    it('deletes the LocalizedText', async () => {
      const localizedText = await createLocalizedText({ user })
      await subject(localizedText, 204)

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

  context('when owningModel is specified', () => {
    it('generates specs with both user and attached model', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/Host/ReviewsController',
        route: 'v1/host/reviews',
        fullyQualifiedModelName: 'Review',
        columnsWithTypes: ['content:text', 'rating:integer'],
        owningModel: 'Host',
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
