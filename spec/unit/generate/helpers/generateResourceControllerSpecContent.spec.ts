import generateResourceControllerSpecContent from '../../../../src/generate/helpers/generateResourceControllerSpecContent.js'

describe('generateResourceControllerSpecContent', () => {
  it('generates a useful resource controller spec', () => {
    const res = generateResourceControllerSpecContent({
      fullyQualifiedControllerName: 'V1/PostsController',
      route: 'v1/posts',
      fullyQualifiedModelName: 'Post',
      columnsWithTypes: [
        'body:text',
        'rating:decimal:3,2',
        'style:enum:building_style:cottage,cabin',
        'User:belongs_to',
      ],
    })
    expect(res).toEqual(`\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '../../../../src/app/models/Post.js'
import User from '../../../../src/app/models/User.js'
import createPost from '../../../factories/PostFactory.js'
import createUser from '../../../factories/UserFactory.js'
import { session, SpecRequestType } from '../../helpers/authentication.js'

describe('V1/PostsController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/v1/posts', expectedStatus)
    }

    it('returns the index of Posts', async () => {
      const post = await createPost({ user })
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
      return request.get('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({ user })
      const { body } = await subject(post, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          body: post.body,
          rating: post.rating,
          style: post.style,
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
      return request.post('/v1/posts', expectedStatus, { data })
    }

    it('creates a Post for this User', async () => {
      const { body } = await subject({
        body: 'The Post body',
        rating: 1.1,
        style: 'cottage',
      }, 201)
      const post = await user.associationQuery('posts').firstOrFail()

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          body: 'The Post body',
          rating: 1.1,
          style: 'cottage',
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
      return request.patch('/v1/posts/{id}', expectedStatus, {
        id: post.id,
        data,
      })
    }

    it('updates the Post', async () => {
      const post = await createPost({ user })
      await subject(post, {
        body: 'Updated Post body',
        rating: 2.2,
        style: 'cabin',
      }, 204)

      await post.reload()
      expect(post.body).toEqual('Updated Post body')
      expect(post.rating).toEqual(2.2)
      expect(post.style).toEqual('cabin')
    })

    context('a Post created by another User', () => {
      it('is not updated', async () => {
        const post = await createPost()
        const originalBody = post.body
        const originalRating = post.rating
        const originalStyle = post.style

        await subject(post, {
          body: 'Updated Post body',
          rating: 2.2,
          style: 'cabin',
        }, 404)

        await post.reload()
        expect(post.body).toEqual(originalBody)
        expect(post.rating).toEqual(originalRating)
        expect(post.style).toEqual(originalStyle)
      })
    })
  })

  describe('DELETE destroy', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.delete('/v1/posts/{id}', expectedStatus, {
        id: post.id,
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
          'body_markdown:text',
          'deleted_at:datetime',
        ],
      })
      expect(res).toEqual(`\
import { UpdateableProperties } from '@rvoh/dream'
import LocalizedText from '../../../../../src/app/models/LocalizedText.js'
import User from '../../../../../src/app/models/User.js'
import createLocalizedText from '../../../../factories/LocalizedTextFactory.js'
import createUser from '../../../../factories/UserFactory.js'
import { session, SpecRequestType } from '../../../helpers/authentication.js'

describe('V1/Host/LocalizedTextsController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/v1/host/localized-texts', expectedStatus)
    }

    it('returns the index of LocalizedTexts', async () => {
      const localizedText = await createLocalizedText({ user })
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
      })
    }

    it('returns the specified LocalizedText', async () => {
      const localizedText = await createLocalizedText({ user })
      const { body } = await subject(localizedText, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: localizedText.id,
          locale: localizedText.locale,
          title: localizedText.title,
          bodyMarkdown: localizedText.bodyMarkdown,
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
      return request.post('/v1/host/localized-texts', expectedStatus, { data })
    }

    it('creates a LocalizedText for this User', async () => {
      const { body } = await subject({
        locale: 'en-US',
        title: 'The LocalizedText title',
        bodyMarkdown: 'The LocalizedText bodyMarkdown',
      }, 201)
      const localizedText = await user.associationQuery('localizedTexts').firstOrFail()

      expect(body).toEqual(
        expect.objectContaining({
          id: localizedText.id,
          locale: 'en-US',
          title: 'The LocalizedText title',
          bodyMarkdown: 'The LocalizedText bodyMarkdown',
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
      })
    }

    it('updates the LocalizedText', async () => {
      const localizedText = await createLocalizedText({ user })
      await subject(localizedText, {
        locale: 'es-ES',
        title: 'Updated LocalizedText title',
        bodyMarkdown: 'Updated LocalizedText bodyMarkdown',
      }, 204)

      await localizedText.reload()
      expect(localizedText.locale).toEqual('es-ES')
      expect(localizedText.title).toEqual('Updated LocalizedText title')
      expect(localizedText.bodyMarkdown).toEqual('Updated LocalizedText bodyMarkdown')
    })

    context('a LocalizedText created by another User', () => {
      it('is not updated', async () => {
        const localizedText = await createLocalizedText()
        const originalLocale = localizedText.locale
        const originalTitle = localizedText.title
        const originalBodyMarkdown = localizedText.bodyMarkdown

        await subject(localizedText, {
          locale: 'es-ES',
          title: 'Updated LocalizedText title',
          bodyMarkdown: 'Updated LocalizedText bodyMarkdown',
        }, 404)

        await localizedText.reload()
        expect(localizedText.locale).toEqual(originalLocale)
        expect(localizedText.title).toEqual(originalTitle)
        expect(localizedText.bodyMarkdown).toEqual(originalBodyMarkdown)
      })
    })
  })

  describe('DELETE destroy', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(localizedText: LocalizedText, expectedStatus: StatusCode) => {
      return request.delete('/v1/host/localized-texts/{id}', expectedStatus, {
        id: localizedText.id,
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
    it('generates a useful resource controller spec', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/PostsController',
        route: 'v1/posts',
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: ['body:text', 'rating:decimal:3,2', 'Host:belongs_to'],
        owningModel: 'Host',
      })
      expect(res).toEqual(`\
import { UpdateableProperties } from '@rvoh/dream'
import Post from '../../../../src/app/models/Post.js'
import User from '../../../../src/app/models/User.js'
import Host from '../../../../src/app/models/Host.js'
import createPost from '../../../factories/PostFactory.js'
import createUser from '../../../factories/UserFactory.js'
import createHost from '../../../factories/HostFactory.js'
import { session, SpecRequestType } from '../../helpers/authentication.js'

describe('V1/PostsController', () => {
  let request: SpecRequestType
  let user: User
  let host: Host

  beforeEach(async () => {
    user = await createUser()
    host = await createHost({ user })
    request = await session(user)
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/v1/posts', expectedStatus)
    }

    it('returns the index of Posts', async () => {
      const post = await createPost({ host })
      const { body } = await subject(200)

      expect(body).toEqual([
        expect.objectContaining({
          id: post.id,
        }),
      ])
    })

    context('Posts created by another Host', () => {
      it('are omitted', async () => {
        await createPost()
        const { body } = await subject(200)

        expect(body).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.get('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({ host })
      const { body } = await subject(post, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          body: post.body,
          rating: post.rating,
        }),
      )
    })

    context('Post created by another Host', () => {
      it('is not found', async () => {
        const otherHostPost = await createPost()
        await subject(otherHostPost, 404)
      })
    })
  })

  describe('POST create', () => {
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<Post>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/posts', expectedStatus, { data })
    }

    it('creates a Post for this Host', async () => {
      const { body } = await subject({
        body: 'The Post body',
        rating: 1.1,
      }, 201)
      const post = await host.associationQuery('posts').firstOrFail()

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          body: 'The Post body',
          rating: 1.1,
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
      return request.patch('/v1/posts/{id}', expectedStatus, {
        id: post.id,
        data,
      })
    }

    it('updates the Post', async () => {
      const post = await createPost({ host })
      await subject(post, {
        body: 'Updated Post body',
        rating: 2.2,
      }, 204)

      await post.reload()
      expect(post.body).toEqual('Updated Post body')
      expect(post.rating).toEqual(2.2)
    })

    context('a Post created by another Host', () => {
      it('is not updated', async () => {
        const post = await createPost()
        const originalBody = post.body
        const originalRating = post.rating

        await subject(post, {
          body: 'Updated Post body',
          rating: 2.2,
        }, 404)

        await post.reload()
        expect(post.body).toEqual(originalBody)
        expect(post.rating).toEqual(originalRating)
      })
    })
  })

  describe('DELETE destroy', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.delete('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('deletes the Post', async () => {
      const post = await createPost({ host })
      await subject(post, 204)

      expect(await Post.find(post.id)).toBeNull()
    })

    context('a Post created by another Host', () => {
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

  context('an Admin controller', () => {
    it('replaces authenticates with the AdminUser, but created resources don’t belong to the AdminUser', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'Admin/ArticlesController',
        route: 'admin/articles',
        fullyQualifiedModelName: 'Article',
        columnsWithTypes: ['body:text', 'rating:decimal:3,2'],
      })
      expect(res).toEqual(`\
import { UpdateableProperties } from '@rvoh/dream'
import Article from '../../../../src/app/models/Article.js'
import AdminUser from '../../../../src/app/models/AdminUser.js'
import createArticle from '../../../factories/ArticleFactory.js'
import createAdminUser from '../../../factories/AdminUserFactory.js'
import { session, SpecRequestType } from '../../helpers/authentication.js'

describe('Admin/ArticlesController', () => {
  let request: SpecRequestType
  let adminUser: AdminUser

  beforeEach(async () => {
    adminUser = await createAdminUser()
    request = await session(adminUser)
  })

  describe('GET index', () => {
    const subject = async <StatusCode extends 200 | 400>(expectedStatus: StatusCode) => {
      return request.get('/admin/articles', expectedStatus)
    }

    it('returns the index of Articles', async () => {
      const article = await createArticle()
      const { body } = await subject(200)

      expect(body).toEqual([
        expect.objectContaining({
          id: article.id,
        }),
      ])
    })
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.get('/admin/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('returns the specified Article', async () => {
      const article = await createArticle()
      const { body } = await subject(article, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: article.id,
          body: article.body,
          rating: article.rating,
        }),
      )
    })
  })

  describe('POST create', () => {
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<Article>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/admin/articles', expectedStatus, { data })
    }

    it('creates a Article', async () => {
      const { body } = await subject({
        body: 'The Article body',
        rating: 1.1,
      }, 201)
      const article = await Article.firstOrFail()

      expect(body).toEqual(
        expect.objectContaining({
          id: article.id,
          body: 'The Article body',
          rating: 1.1,
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(
      article: Article,
      data: UpdateableProperties<Article>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/admin/articles/{id}', expectedStatus, {
        id: article.id,
        data,
      })
    }

    it('updates the Article', async () => {
      const article = await createArticle()
      await subject(article, {
        body: 'Updated Article body',
        rating: 2.2,
      }, 204)

      await article.reload()
      expect(article.body).toEqual('Updated Article body')
      expect(article.rating).toEqual(2.2)
    })
  })

  describe('DELETE destroy', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.delete('/admin/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('deletes the Article', async () => {
      const article = await createArticle()
      await subject(article, 204)

      expect(await Article.find(article.id)).toBeNull()
    })
  })
})
`)
    })
  })
})
