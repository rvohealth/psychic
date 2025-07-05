import generateResourceControllerSpecContent from '../../../../src/generate/helpers/generateResourceControllerSpecContent.js'
import { RESOURCE_ACTIONS } from '../../../../src/generate/resource.js'

describe('generateResourceControllerSpecContent', () => {
  it(
    'generates a useful resource controller spec (omitting deletedAt from create and update action specs ' +
      'since deletedAt is for deleting)',
    () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/PostsController',
        route: 'v1/posts',
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: [
          'type:enum:post_type:WeeklyPost,GuestPost',
          'style:enum:building_style:formal,informal',
          'title:citext',
          'subtitle:string',
          'body_markdown:text',
          'rating:decimal:3,2',
          'ratings:integer',
          'big_rating:bigint',
          'User:belongs_to',
          'postable_id:bigint',
          'postable_type:enum:postable_types:article,column',
          'deleted_at:datetime:optional',
        ],
        forAdmin: false,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
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
          type: post.type,
          style: post.style,
          title: post.title,
          subtitle: post.subtitle,
          bodyMarkdown: post.bodyMarkdown,
          rating: post.rating,
          ratings: post.ratings,
          bigRating: post.bigRating,
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
        type: 'WeeklyPost',
        style: 'formal',
        title: 'The Post title',
        subtitle: 'The Post subtitle',
        bodyMarkdown: 'The Post bodyMarkdown',
        rating: 1.1,
        ratings: 1,
        bigRating: '11111111111111111',
      }, 201)

      const post = await user.associationQuery('posts').firstOrFail()
      expect(post.type).toEqual('WeeklyPost')
      expect(post.style).toEqual('formal')
      expect(post.title).toEqual('The Post title')
      expect(post.subtitle).toEqual('The Post subtitle')
      expect(post.bodyMarkdown).toEqual('The Post bodyMarkdown')
      expect(post.rating).toEqual(1.1)
      expect(post.ratings).toEqual(1)
      expect(post.bigRating).toEqual('11111111111111111')

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          type: post.type,
          style: post.style,
          title: post.title,
          subtitle: post.subtitle,
          bodyMarkdown: post.bodyMarkdown,
          rating: post.rating,
          ratings: post.ratings,
          bigRating: post.bigRating,
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
        type: 'GuestPost',
        style: 'informal',
        title: 'Updated Post title',
        subtitle: 'Updated Post subtitle',
        bodyMarkdown: 'Updated Post bodyMarkdown',
        rating: 2.2,
        ratings: 2,
        bigRating: '22222222222222222',
      }, 204)

      await post.reload()
      expect(post.type).toEqual('GuestPost')
      expect(post.style).toEqual('informal')
      expect(post.title).toEqual('Updated Post title')
      expect(post.subtitle).toEqual('Updated Post subtitle')
      expect(post.bodyMarkdown).toEqual('Updated Post bodyMarkdown')
      expect(post.rating).toEqual(2.2)
      expect(post.ratings).toEqual(2)
      expect(post.bigRating).toEqual('22222222222222222')
    })

    context('a Post created by another User', () => {
      it('is not updated', async () => {
        const post = await createPost()
        const originalType = post.type
        const originalStyle = post.style
        const originalTitle = post.title
        const originalSubtitle = post.subtitle
        const originalBodyMarkdown = post.bodyMarkdown
        const originalRating = post.rating
        const originalRatings = post.ratings
        const originalBigRating = post.bigRating

        await subject(post, {
          type: 'GuestPost',
          style: 'informal',
          title: 'Updated Post title',
          subtitle: 'Updated Post subtitle',
          bodyMarkdown: 'Updated Post bodyMarkdown',
          rating: 2.2,
          ratings: 2,
          bigRating: '22222222222222222',
        }, 404)

        await post.reload()
        expect(post.type).toEqual(originalType)
        expect(post.style).toEqual(originalStyle)
        expect(post.title).toEqual(originalTitle)
        expect(post.subtitle).toEqual(originalSubtitle)
        expect(post.bodyMarkdown).toEqual(originalBodyMarkdown)
        expect(post.rating).toEqual(originalRating)
        expect(post.ratings).toEqual(originalRatings)
        expect(post.bigRating).toEqual(originalBigRating)
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
    },
  )

  context('only', () => {
    it('omits actions left out of the list', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/PostsController',
        route: 'v1/posts',
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: [
          'type:enum:post_type:WeeklyPost,GuestPost',
          'style:enum:building_style:formal,informal',
          'title:citext',
          'subtitle:string',
          'body_markdown:text',
          'rating:decimal:3,2',
          'ratings:integer',
          'big_rating:bigint',
          'User:belongs_to',
          'postable_id:bigint',
          'postable_type:enum:postable_types:article,column',
        ],
        forAdmin: false,
        singular: false,
        actions: ['create', 'show'],
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
          type: post.type,
          style: post.style,
          title: post.title,
          subtitle: post.subtitle,
          bodyMarkdown: post.bodyMarkdown,
          rating: post.rating,
          ratings: post.ratings,
          bigRating: post.bigRating,
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
        type: 'WeeklyPost',
        style: 'formal',
        title: 'The Post title',
        subtitle: 'The Post subtitle',
        bodyMarkdown: 'The Post bodyMarkdown',
        rating: 1.1,
        ratings: 1,
        bigRating: '11111111111111111',
      }, 201)

      const post = await user.associationQuery('posts').firstOrFail()
      expect(post.type).toEqual('WeeklyPost')
      expect(post.style).toEqual('formal')
      expect(post.title).toEqual('The Post title')
      expect(post.subtitle).toEqual('The Post subtitle')
      expect(post.bodyMarkdown).toEqual('The Post bodyMarkdown')
      expect(post.rating).toEqual(1.1)
      expect(post.ratings).toEqual(1)
      expect(post.bigRating).toEqual('11111111111111111')

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          type: post.type,
          style: post.style,
          title: post.title,
          subtitle: post.subtitle,
          bodyMarkdown: post.bodyMarkdown,
          rating: post.rating,
          ratings: post.ratings,
          bigRating: post.bigRating,
        }),
      )
    })
  })
})
`)
    })
  })

  context('singular', () => {
    it('updates does not pass id and omits index', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/HostingAgreementController',
        route: 'v1/hosting-agreement',
        fullyQualifiedModelName: 'HostingAgreement',
        columnsWithTypes: ['signed_on:date', 'signed_at:datetime'],
        forAdmin: false,
        singular: true,
        actions: [...RESOURCE_ACTIONS],
      })
      expect(res).toEqual(`\
import { UpdateableProperties, CalendarDate, DateTime } from '@rvoh/dream'
import HostingAgreement from '../../../../src/app/models/HostingAgreement.js'
import User from '../../../../src/app/models/User.js'
import createHostingAgreement from '../../../factories/HostingAgreementFactory.js'
import createUser from '../../../factories/UserFactory.js'
import { session, SpecRequestType } from '../../helpers/authentication.js'

describe('V1/HostingAgreementController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET show', () => {
    const subject = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/hosting-agreement', expectedStatus)
    }

    it('returns the HostingAgreement belonging to the User', async () => {
      const hostingAgreement = await createHostingAgreement({ user })

      const { body } = await subject(200)

      expect(body).toEqual(
        expect.objectContaining({
          id: hostingAgreement.id,
          signedOn: hostingAgreement.signedOn.toISO(),
          signedAt: hostingAgreement.signedAt.toISO(),
        }),
      )
    })
  })

  describe('POST create', () => {
    const subject = async <StatusCode extends 201 | 400>(
      data: UpdateableProperties<HostingAgreement>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/hosting-agreement', expectedStatus, { data })
    }

    it('creates a HostingAgreement for this User', async () => {
      const today = CalendarDate.today()
      const now = DateTime.now()

      const { body } = await subject({
        signedOn: today,
        signedAt: now,
      }, 201)

      const hostingAgreement = await user.associationQuery('hostingAgreement').firstOrFail()
      expect(hostingAgreement.signedOn).toEqualCalendarDate(today)
      expect(hostingAgreement.signedAt).toEqualDateTime(now)

      expect(body).toEqual(
        expect.objectContaining({
          id: hostingAgreement.id,
          signedOn: hostingAgreement.signedOn.toISO(),
          signedAt: hostingAgreement.signedAt.toISO(),
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(
      data: UpdateableProperties<HostingAgreement>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/v1/hosting-agreement', expectedStatus, {
        data,
      })
    }

    it('updates the HostingAgreement', async () => {
      const yesterday = CalendarDate.yesterday()
      const lastHour = DateTime.now().minus({ hour: 1 })

      const hostingAgreement = await createHostingAgreement({ user })

      await subject({
        signedOn: yesterday,
        signedAt: lastHour,
      }, 204)

      await hostingAgreement.reload()
      expect(hostingAgreement.signedOn).toEqualCalendarDate(yesterday)
      expect(hostingAgreement.signedAt).toEqualDateTime(lastHour)
    })
  })

  describe('DELETE destroy', () => {
    const subject = async <StatusCode extends 204 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.delete('/v1/hosting-agreement', expectedStatus)
    }

    it('deletes the HostingAgreement', async () => {
      const hostingAgreement = await createHostingAgreement({ user })

      await subject(204)

      expect(await HostingAgreement.find(hostingAgreement.id)).toBeNull()
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
        columnsWithTypes: ['body:text', 'Host:belongs_to'],
        owningModel: 'Host',
        forAdmin: false,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
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
      }, 201)

      const post = await host.associationQuery('posts').firstOrFail()
      expect(post.body).toEqual('The Post body')

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          body: post.body,
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
      }, 204)

      await post.reload()
      expect(post.body).toEqual('Updated Post body')
    })

    context('a Post created by another Host', () => {
      it('is not updated', async () => {
        const post = await createPost()
        const originalBody = post.body

        await subject(post, {
          body: 'Updated Post body',
        }, 404)

        await post.reload()
        expect(post.body).toEqual(originalBody)
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
        columnsWithTypes: ['body:text'],
        forAdmin: true,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
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
      }, 201)

      const article = await Article.firstOrFail()
      expect(article.body).toEqual('The Article body')

      expect(body).toEqual(
        expect.objectContaining({
          id: article.id,
          body: article.body,
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
      }, 204)

      await article.reload()
      expect(article.body).toEqual('Updated Article body')
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
