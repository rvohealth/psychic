import { DreamApp } from '@rvoh/dream'
import generateResourceControllerSpecContent from '../../../../src/generate/helpers/generateResourceControllerSpecContent.js'
import { RESOURCE_ACTIONS } from '../../../../src/generate/resource.js'
import PsychicApp from '../../../../src/psychic-app/index.js'

describe('generateResourceControllerSpecContent', () => {
  it(
    'generates a useful resource controller spec (omitting type & deletedAt from create and update action specs ' +
      'since type is for STI and deletedAt is for deleting)',
    () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/PostsController',
        route: 'v1/posts',
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: [
          'my_uuid:uuid',
          'uuid_not_defined_as_uuid:citext',
          'type:enum:post_type:WeeklyPost,GuestPost',
          'style:enum:building_style:formal,informal',
          'title:citext',
          'subtitle:string',
          'secret:encrypted',
          'body_markdown:text',
          'rating:decimal:3,2',
          'ratings:integer',
          'big_rating:bigint',
          'User:belongs_to',
          'postable_id:bigint',
          'postable_type:enum:postable_types:article,column',
          'deleted_at:datetime:optional',
          'signed_on:date',
          'signed_at:datetime',
          'uuid_array:uuid[]',
          'integer_array:integer[]',
          'decimal_array:decimal[]:3,2',
          'bigint_array:bigint[]',
          'string_array:string[]',
          'enum_array:enum[]:my_enum:enum_1,enum_2',
          'date_array:date[]',
          'datetime_array:datetime[]',
        ],
        forAdmin: false,
        forInternal: false,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
      })
      expect(res).toEqual(`\
import { randomUUID } from 'node:crypto'
import { CalendarDate, DateTime } from '@rvoh/dream'
import Post from '@models/Post.js'
import User from '@models/User.js'
import createPost from '@spec/factories/PostFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/PostsController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/posts', expectedStatus)
    }

    it('returns the index of Posts', async () => {
      const post = await createPost({ user })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: post.id,
        }),
      ])
    })

    context('Posts created by another User', () => {
      it('are omitted', async () => {
        await createPost()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.get('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({ user })

      const { body } = await show(post, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          myUuid: post.myUuid,
          uuidNotDefinedAsUuid: post.uuidNotDefinedAsUuid,
          type: post.type,
          style: post.style,
          title: post.title,
          subtitle: post.subtitle,
          secret: post.secret,
          bodyMarkdown: post.bodyMarkdown,
          rating: post.rating,
          ratings: post.ratings,
          bigRating: post.bigRating,
          signedOn: post.signedOn.toISO(),
          signedAt: post.signedAt.toISO(),
          uuidArray: post.uuidArray,
          integerArray: post.integerArray,
          decimalArray: post.decimalArray,
          bigintArray: post.bigintArray,
          stringArray: post.stringArray,
          enumArray: post.enumArray,
          dateArray: post.dateArray.map(date => date.toISO()),
          datetimeArray: post.datetimeArray.map(datetime => datetime.toISO()),
        }),
      )
    })

    context('Post created by another User', () => {
      it('is not found', async () => {
        const otherUserPost = await createPost()

        await show(otherUserPost, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/posts'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/posts', expectedStatus, {
        data
      })
    }

    it('creates a Post for this User', async () => {
      const myUuid = randomUUID()
      const uuidNotDefinedAsUuid = randomUUID()
      const uuidArray = [randomUUID()]
      const today = CalendarDate.today()
      const now = DateTime.now()

      const { body } = await create({
        myUuid: myUuid,
        uuidNotDefinedAsUuid: uuidNotDefinedAsUuid,
        style: 'formal',
        title: 'The Post title',
        subtitle: 'The Post subtitle',
        secret: 'The Post secret',
        bodyMarkdown: 'The Post bodyMarkdown',
        rating: 1.1,
        ratings: 1,
        bigRating: '11111111111111111',
        signedOn: today.toISO(),
        signedAt: now.toISO(),
        uuidArray: uuidArray,
        integerArray: [1],
        decimalArray: [1.1],
        bigintArray: ['11111111111111111'],
        stringArray: ['The Post stringArray'],
        enumArray: ['enum_1'],
        dateArray: [today.toISO()],
        datetimeArray: [now.toISO()],
      }, 201)

      const post = await user.associationQuery('posts').firstOrFail()
      expect(post.myUuid).toEqual(myUuid)
      expect(post.uuidNotDefinedAsUuid).toEqual(uuidNotDefinedAsUuid)
      expect(post.style).toEqual('formal')
      expect(post.title).toEqual('The Post title')
      expect(post.subtitle).toEqual('The Post subtitle')
      expect(post.secret).toEqual('The Post secret')
      expect(post.bodyMarkdown).toEqual('The Post bodyMarkdown')
      expect(post.rating).toEqual(1.1)
      expect(post.ratings).toEqual(1)
      expect(post.bigRating).toEqual('11111111111111111')
      expect(post.signedOn).toEqualCalendarDate(today)
      expect(post.signedAt).toEqualDateTime(now)
      expect(post.uuidArray).toEqual(uuidArray)
      expect(post.integerArray).toEqual([1])
      expect(post.decimalArray).toEqual([1.1])
      expect(post.bigintArray).toEqual(['11111111111111111'])
      expect(post.stringArray).toEqual(['The Post stringArray'])
      expect(post.enumArray).toEqual(['enum_1'])
      expect(post.dateArray[0]).toEqualCalendarDate(today)
      expect(post.datetimeArray[0]).toEqualDateTime(now)

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          myUuid: post.myUuid,
          uuidNotDefinedAsUuid: post.uuidNotDefinedAsUuid,
          type: post.type,
          style: post.style,
          title: post.title,
          subtitle: post.subtitle,
          secret: post.secret,
          bodyMarkdown: post.bodyMarkdown,
          rating: post.rating,
          ratings: post.ratings,
          bigRating: post.bigRating,
          signedOn: post.signedOn.toISO(),
          signedAt: post.signedAt.toISO(),
          uuidArray: post.uuidArray,
          integerArray: post.integerArray,
          decimalArray: post.decimalArray,
          bigintArray: post.bigintArray,
          stringArray: post.stringArray,
          enumArray: post.enumArray,
          dateArray: post.dateArray.map(date => date.toISO()),
          datetimeArray: post.datetimeArray.map(datetime => datetime.toISO()),
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      post: Post,
      data: RequestBody<'patch', '/v1/posts/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/v1/posts/{id}', expectedStatus, {
        id: post.id,
        data,
      })
    }

    it('updates the Post', async () => {
      const newMyUuid = randomUUID()
      const newUuidNotDefinedAsUuid = randomUUID()
      const newUuidArray = [randomUUID()]
      const yesterday = CalendarDate.yesterday()
      const lastHour = DateTime.now().minus({ hour: 1 })

      const post = await createPost({ user })

      await update(post, {
        myUuid: newMyUuid,
        uuidNotDefinedAsUuid: newUuidNotDefinedAsUuid,
        style: 'informal',
        title: 'Updated Post title',
        subtitle: 'Updated Post subtitle',
        secret: 'Updated Post secret',
        bodyMarkdown: 'Updated Post bodyMarkdown',
        rating: 2.2,
        ratings: 2,
        bigRating: '22222222222222222',
        signedOn: yesterday.toISO(),
        signedAt: lastHour.toISO(),
        uuidArray: newUuidArray,
        integerArray: [2],
        decimalArray: [2.2],
        bigintArray: ['22222222222222222'],
        stringArray: ['Updated Post stringArray'],
        enumArray: ['enum_2'],
        dateArray: [yesterday.toISO()],
        datetimeArray: [lastHour.toISO()],
      }, 204)

      await post.reload()
      expect(post.myUuid).toEqual(newMyUuid)
      expect(post.uuidNotDefinedAsUuid).toEqual(newUuidNotDefinedAsUuid)
      expect(post.style).toEqual('informal')
      expect(post.title).toEqual('Updated Post title')
      expect(post.subtitle).toEqual('Updated Post subtitle')
      expect(post.secret).toEqual('Updated Post secret')
      expect(post.bodyMarkdown).toEqual('Updated Post bodyMarkdown')
      expect(post.rating).toEqual(2.2)
      expect(post.ratings).toEqual(2)
      expect(post.bigRating).toEqual('22222222222222222')
      expect(post.signedOn).toEqualCalendarDate(yesterday)
      expect(post.signedAt).toEqualDateTime(lastHour)
      expect(post.uuidArray).toEqual(newUuidArray)
      expect(post.integerArray).toEqual([2])
      expect(post.decimalArray).toEqual([2.2])
      expect(post.bigintArray).toEqual(['22222222222222222'])
      expect(post.stringArray).toEqual(['Updated Post stringArray'])
      expect(post.enumArray).toEqual(['enum_2'])
      expect(post.dateArray[0]).toEqualCalendarDate(yesterday)
      expect(post.datetimeArray[0]).toEqualDateTime(lastHour)
    })

    context('a Post created by another User', () => {
      it('is not updated', async () => {
        const yesterday = CalendarDate.yesterday()
        const lastHour = DateTime.now().minus({ hour: 1 })

        const post = await createPost()
        const originalMyUuid = post.myUuid
        const originalUuidNotDefinedAsUuid = post.uuidNotDefinedAsUuid
        const originalStyle = post.style
        const originalTitle = post.title
        const originalSubtitle = post.subtitle
        const originalSecret = post.secret
        const originalBodyMarkdown = post.bodyMarkdown
        const originalRating = post.rating
        const originalRatings = post.ratings
        const originalBigRating = post.bigRating
        const originalSignedOn = post.signedOn
        const originalSignedAt = post.signedAt
        const originalUuidArray = post.uuidArray
        const originalIntegerArray = post.integerArray
        const originalDecimalArray = post.decimalArray
        const originalBigintArray = post.bigintArray
        const originalStringArray = post.stringArray
        const originalEnumArray = post.enumArray

        await update(post, {
          myUuid: randomUUID(),
          uuidNotDefinedAsUuid: randomUUID(),
          style: 'informal',
          title: 'Updated Post title',
          subtitle: 'Updated Post subtitle',
          secret: 'Updated Post secret',
          bodyMarkdown: 'Updated Post bodyMarkdown',
          rating: 2.2,
          ratings: 2,
          bigRating: '22222222222222222',
          signedOn: yesterday.toISO(),
          signedAt: lastHour.toISO(),
          uuidArray: [randomUUID()],
          integerArray: [2],
          decimalArray: [2.2],
          bigintArray: ['22222222222222222'],
          stringArray: ['Updated Post stringArray'],
          enumArray: ['enum_2'],
          dateArray: [yesterday.toISO()],
          datetimeArray: [lastHour.toISO()],
        }, 404)

        await post.reload()
        expect(post.myUuid).toEqual(originalMyUuid)
        expect(post.uuidNotDefinedAsUuid).toEqual(originalUuidNotDefinedAsUuid)
        expect(post.style).toEqual(originalStyle)
        expect(post.title).toEqual(originalTitle)
        expect(post.subtitle).toEqual(originalSubtitle)
        expect(post.secret).toEqual(originalSecret)
        expect(post.bodyMarkdown).toEqual(originalBodyMarkdown)
        expect(post.rating).toEqual(originalRating)
        expect(post.ratings).toEqual(originalRatings)
        expect(post.bigRating).toEqual(originalBigRating)
        expect(post.signedOn).toEqual(originalSignedOn)
        expect(post.signedAt).toEqual(originalSignedAt)
        expect(post.uuidArray).toEqual(originalUuidArray)
        expect(post.integerArray).toEqual(originalIntegerArray)
        expect(post.decimalArray).toEqual(originalDecimalArray)
        expect(post.bigintArray).toEqual(originalBigintArray)
        expect(post.stringArray).toEqual(originalStringArray)
        expect(post.enumArray).toEqual(originalEnumArray)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.delete('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('deletes the Post', async () => {
      const post = await createPost({ user })

      await destroy(post, 204)

      expect(await Post.find(post.id)).toBeNull()
    })

    context('a Post created by another User', () => {
      it('is not deleted', async () => {
        const post = await createPost()

        await destroy(post, 404)

        expect(await Post.find(post.id)).toMatchDreamModel(post)
      })
    })
  })
})
`)
    },
  )

  context('using alternate casings for associations', () => {
    it('generates valid associations for alternate casings', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/PostsController',
        route: 'v1/posts',
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: ['User:belongsto', 'title:citext'],
        forAdmin: false,
        forInternal: false,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
      })
      expect(res).toEqual(`\
import Post from '@models/Post.js'
import User from '@models/User.js'
import createPost from '@spec/factories/PostFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/PostsController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/posts', expectedStatus)
    }

    it('returns the index of Posts', async () => {
      const post = await createPost({ user })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: post.id,
        }),
      ])
    })

    context('Posts created by another User', () => {
      it('are omitted', async () => {
        await createPost()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.get('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({ user })

      const { body } = await show(post, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          title: post.title,
        }),
      )
    })

    context('Post created by another User', () => {
      it('is not found', async () => {
        const otherUserPost = await createPost()

        await show(otherUserPost, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/posts'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/posts', expectedStatus, {
        data
      })
    }

    it('creates a Post for this User', async () => {
      const { body } = await create({
        title: 'The Post title',
      }, 201)

      const post = await user.associationQuery('posts').firstOrFail()
      expect(post.title).toEqual('The Post title')

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
          title: post.title,
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      post: Post,
      data: RequestBody<'patch', '/v1/posts/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/v1/posts/{id}', expectedStatus, {
        id: post.id,
        data,
      })
    }

    it('updates the Post', async () => {
      const post = await createPost({ user })

      await update(post, {
        title: 'Updated Post title',
      }, 204)

      await post.reload()
      expect(post.title).toEqual('Updated Post title')
    })

    context('a Post created by another User', () => {
      it('is not updated', async () => {
        const post = await createPost()
        const originalTitle = post.title

        await update(post, {
          title: 'Updated Post title',
        }, 404)

        await post.reload()
        expect(post.title).toEqual(originalTitle)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.delete('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('deletes the Post', async () => {
      const post = await createPost({ user })

      await destroy(post, 204)

      expect(await Post.find(post.id)).toBeNull()
    })

    context('a Post created by another User', () => {
      it('is not deleted', async () => {
        const post = await createPost()

        await destroy(post, 404)

        expect(await Post.find(post.id)).toMatchDreamModel(post)
      })
    })
  })
})
`)
    })
  })

  context('`only` CLI option', () => {
    it('omits actions left out of the list', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'V1/PostsController',
        route: 'v1/posts',
        fullyQualifiedModelName: 'Post',
        columnsWithTypes: [
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
        forInternal: false,
        singular: false,
        actions: ['create', 'show'],
      })
      expect(res).toEqual(`\
import Post from '@models/Post.js'
import User from '@models/User.js'
import createPost from '@spec/factories/PostFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/PostsController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.get('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({ user })

      const { body } = await show(post, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: post.id,
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

        await show(otherUserPost, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/posts'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/posts', expectedStatus, {
        data
      })
    }

    it('creates a Post for this User', async () => {
      const { body } = await create({
        style: 'formal',
        title: 'The Post title',
        subtitle: 'The Post subtitle',
        bodyMarkdown: 'The Post bodyMarkdown',
        rating: 1.1,
        ratings: 1,
        bigRating: '11111111111111111',
      }, 201)

      const post = await user.associationQuery('posts').firstOrFail()
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
        forInternal: false,
        singular: true,
        actions: [...RESOURCE_ACTIONS],
      })
      expect(res).toEqual(`\
import { CalendarDate, DateTime } from '@rvoh/dream'
import HostingAgreement from '@models/HostingAgreement.js'
import User from '@models/User.js'
import createHostingAgreement from '@spec/factories/HostingAgreementFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('V1/HostingAgreementController', () => {
  let request: SpecRequestType
  let user: User

  beforeEach(async () => {
    user = await createUser()
    request = await session(user)
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/hosting-agreement', expectedStatus)
    }

    it('returns the HostingAgreement belonging to the User', async () => {
      const hostingAgreement = await createHostingAgreement({ user })

      const { body } = await show(200)

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
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/hosting-agreement'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/hosting-agreement', expectedStatus, {
        data
      })
    }

    it('creates a HostingAgreement for this User', async () => {
      const today = CalendarDate.today()
      const now = DateTime.now()

      const { body } = await create({
        signedOn: today.toISO(),
        signedAt: now.toISO(),
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
    const update = async <StatusCode extends 204 | 400 | 404>(
      data: RequestBody<'patch', '/v1/hosting-agreement'>,
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

      await update({
        signedOn: yesterday.toISO(),
        signedAt: lastHour.toISO(),
      }, 204)

      await hostingAgreement.reload()
      expect(hostingAgreement.signedOn).toEqualCalendarDate(yesterday)
      expect(hostingAgreement.signedAt).toEqualDateTime(lastHour)
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.delete('/v1/hosting-agreement', expectedStatus)
    }

    it('deletes the HostingAgreement', async () => {
      const hostingAgreement = await createHostingAgreement({ user })

      await destroy(204)

      expect(await HostingAgreement.find(hostingAgreement.id)).toBeNull()
    })
  })
})
`)
    })

    context('a nested resource instead of a namespace', () => {
      it('generates a useful resource controller spec', () => {
        const res = generateResourceControllerSpecContent({
          fullyQualifiedControllerName: 'Ticketing/Tickets/CommentsController',
          route: 'ticketing/tickets/{}/comments',
          fullyQualifiedModelName: 'Ticketing/Comment',
          columnsWithTypes: ['body:text', 'Ticketing/Ticket:belongs_to'],
          owningModel: 'Ticketing/Ticket',
          forAdmin: false,
          forInternal: false,
          singular: true,
          actions: [...RESOURCE_ACTIONS],
        })
        expect(res).toEqual(`\
import TicketingComment from '@models/Ticketing/Comment.js'
import User from '@models/User.js'
import TicketingTicket from '@models/Ticketing/Ticket.js'
import createTicketingComment from '@spec/factories/Ticketing/CommentFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import createTicketingTicket from '@spec/factories/Ticketing/TicketFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('Ticketing/Tickets/CommentsController', () => {
  let request: SpecRequestType
  let user: User
  let ticket: TicketingTicket

  beforeEach(async () => {
    user = await createUser()
    ticket = await createTicketingTicket({ user })
    request = await session(user)
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/ticketing/tickets/{ticketId}/comments', expectedStatus, {
        ticketId: ticket.id,
      })
    }

    it('returns the Ticketing/Comment belonging to the TicketingTicket', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      const { body } = await show(200)

      expect(body).toEqual(
        expect.objectContaining({
          id: ticketingComment.id,
          body: ticketingComment.body,
        }),
      )
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/ticketing/tickets/{ticketId}/comments'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/ticketing/tickets/{ticketId}/comments', expectedStatus, {
        ticketId: ticket.id,
        data
      })
    }

    it('creates a Ticketing/Comment for this TicketingTicket', async () => {
      const { body } = await create({
        body: 'The Ticketing/Comment body',
      }, 201)

      const ticketingComment = await ticket.associationQuery('ticketingComment').firstOrFail()
      expect(ticketingComment.body).toEqual('The Ticketing/Comment body')

      expect(body).toEqual(
        expect.objectContaining({
          id: ticketingComment.id,
          body: ticketingComment.body,
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      data: RequestBody<'patch', '/ticketing/tickets/{ticketId}/comments'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/ticketing/tickets/{ticketId}/comments', expectedStatus, {
        ticketId: ticket.id,
        data,
      })
    }

    it('updates the Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      await update({
        body: 'Updated Ticketing/Comment body',
      }, 204)

      await ticketingComment.reload()
      expect(ticketingComment.body).toEqual('Updated Ticketing/Comment body')
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.delete('/ticketing/tickets/{ticketId}/comments', expectedStatus, {
        ticketId: ticket.id,
      })
    }

    it('deletes the Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      await destroy(204)

      expect(await TicketingComment.find(ticketingComment.id)).toBeNull()
    })
  })
})
`)
      })
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
        forInternal: false,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
      })
      expect(res).toEqual(`\
import Post from '@models/Post.js'
import User from '@models/User.js'
import Host from '@models/Host.js'
import createPost from '@spec/factories/PostFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import createHost from '@spec/factories/HostFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

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
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/v1/posts', expectedStatus)
    }

    it('returns the index of Posts', async () => {
      const post = await createPost({ host })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: post.id,
        }),
      ])
    })

    context('Posts created by another Host', () => {
      it('are omitted', async () => {
        await createPost()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.get('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('returns the specified Post', async () => {
      const post = await createPost({ host })

      const { body } = await show(post, 200)

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

        await show(otherHostPost, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/v1/posts'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/v1/posts', expectedStatus, {
        data
      })
    }

    it('creates a Post for this Host', async () => {
      const { body } = await create({
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
    const update = async <StatusCode extends 204 | 400 | 404>(
      post: Post,
      data: RequestBody<'patch', '/v1/posts/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/v1/posts/{id}', expectedStatus, {
        id: post.id,
        data,
      })
    }

    it('updates the Post', async () => {
      const post = await createPost({ host })

      await update(post, {
        body: 'Updated Post body',
      }, 204)

      await post.reload()
      expect(post.body).toEqual('Updated Post body')
    })

    context('a Post created by another Host', () => {
      it('is not updated', async () => {
        const post = await createPost()
        const originalBody = post.body

        await update(post, {
          body: 'Updated Post body',
        }, 404)

        await post.reload()
        expect(post.body).toEqual(originalBody)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(post: Post, expectedStatus: StatusCode) => {
      return request.delete('/v1/posts/{id}', expectedStatus, {
        id: post.id,
      })
    }

    it('deletes the Post', async () => {
      const post = await createPost({ host })

      await destroy(post, 204)

      expect(await Post.find(post.id)).toBeNull()
    })

    context('a Post created by another Host', () => {
      it('is not deleted', async () => {
        const post = await createPost()

        await destroy(post, 404)

        expect(await Post.find(post.id)).toMatchDreamModel(post)
      })
    })
  })
})
`)
    })

    context('when that owning model is nested', () => {
      it('generates a useful resource controller spec', () => {
        const res = generateResourceControllerSpecContent({
          fullyQualifiedControllerName: 'Ticketing/Tickets/CommentsController',
          route: 'ticketing/tickets/comments',
          fullyQualifiedModelName: 'Ticketing/Comment',
          columnsWithTypes: ['body:text', 'Ticketing/Ticket:belongs_to'],
          owningModel: 'Ticketing/Ticket',
          forAdmin: false,
          forInternal: false,
          singular: false,
          actions: [...RESOURCE_ACTIONS],
        })
        expect(res).toEqual(`\
import TicketingComment from '@models/Ticketing/Comment.js'
import User from '@models/User.js'
import TicketingTicket from '@models/Ticketing/Ticket.js'
import createTicketingComment from '@spec/factories/Ticketing/CommentFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import createTicketingTicket from '@spec/factories/Ticketing/TicketFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('Ticketing/Tickets/CommentsController', () => {
  let request: SpecRequestType
  let user: User
  let ticket: TicketingTicket

  beforeEach(async () => {
    user = await createUser()
    ticket = await createTicketingTicket({ user })
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/ticketing/tickets/comments', expectedStatus)
    }

    it('returns the index of Ticketing/Comments', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: ticketingComment.id,
        }),
      ])
    })

    context('TicketingComments created by another TicketingTicket', () => {
      it('are omitted', async () => {
        await createTicketingComment()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(ticketingComment: TicketingComment, expectedStatus: StatusCode) => {
      return request.get('/ticketing/tickets/comments/{id}', expectedStatus, {
        id: ticketingComment.id,
      })
    }

    it('returns the specified Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      const { body } = await show(ticketingComment, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: ticketingComment.id,
          body: ticketingComment.body,
        }),
      )
    })

    context('Ticketing/Comment created by another TicketingTicket', () => {
      it('is not found', async () => {
        const otherTicketingTicketTicketingComment = await createTicketingComment()

        await show(otherTicketingTicketTicketingComment, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/ticketing/tickets/comments'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/ticketing/tickets/comments', expectedStatus, {
        data
      })
    }

    it('creates a Ticketing/Comment for this TicketingTicket', async () => {
      const { body } = await create({
        body: 'The Ticketing/Comment body',
      }, 201)

      const ticketingComment = await ticket.associationQuery('ticketingComments').firstOrFail()
      expect(ticketingComment.body).toEqual('The Ticketing/Comment body')

      expect(body).toEqual(
        expect.objectContaining({
          id: ticketingComment.id,
          body: ticketingComment.body,
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      ticketingComment: TicketingComment,
      data: RequestBody<'patch', '/ticketing/tickets/comments/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/ticketing/tickets/comments/{id}', expectedStatus, {
        id: ticketingComment.id,
        data,
      })
    }

    it('updates the Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      await update(ticketingComment, {
        body: 'Updated Ticketing/Comment body',
      }, 204)

      await ticketingComment.reload()
      expect(ticketingComment.body).toEqual('Updated Ticketing/Comment body')
    })

    context('a Ticketing/Comment created by another TicketingTicket', () => {
      it('is not updated', async () => {
        const ticketingComment = await createTicketingComment()
        const originalBody = ticketingComment.body

        await update(ticketingComment, {
          body: 'Updated Ticketing/Comment body',
        }, 404)

        await ticketingComment.reload()
        expect(ticketingComment.body).toEqual(originalBody)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(ticketingComment: TicketingComment, expectedStatus: StatusCode) => {
      return request.delete('/ticketing/tickets/comments/{id}', expectedStatus, {
        id: ticketingComment.id,
      })
    }

    it('deletes the Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      await destroy(ticketingComment, 204)

      expect(await TicketingComment.find(ticketingComment.id)).toBeNull()
    })

    context('a Ticketing/Comment created by another TicketingTicket', () => {
      it('is not deleted', async () => {
        const ticketingComment = await createTicketingComment()

        await destroy(ticketingComment, 404)

        expect(await TicketingComment.find(ticketingComment.id)).toMatchDreamModel(ticketingComment)
      })
    })
  })
})
`)
      })

      context('a nested resource instead of a namespace', () => {
        it('generates a useful resource controller spec', () => {
          const res = generateResourceControllerSpecContent({
            fullyQualifiedControllerName: 'Ticketing/Tickets/CommentsController',
            route: 'ticketing/tickets/{}/comments',
            fullyQualifiedModelName: 'Ticketing/Comment',
            columnsWithTypes: ['body:text', 'Ticketing/Ticket:belongs_to'],
            owningModel: 'Ticketing/Ticket',
            forAdmin: false,
            forInternal: false,
            singular: false,
            actions: [...RESOURCE_ACTIONS],
          })
          expect(res).toEqual(`\
import TicketingComment from '@models/Ticketing/Comment.js'
import User from '@models/User.js'
import TicketingTicket from '@models/Ticketing/Ticket.js'
import createTicketingComment from '@spec/factories/Ticketing/CommentFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import createTicketingTicket from '@spec/factories/Ticketing/TicketFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('Ticketing/Tickets/CommentsController', () => {
  let request: SpecRequestType
  let user: User
  let ticket: TicketingTicket

  beforeEach(async () => {
    user = await createUser()
    ticket = await createTicketingTicket({ user })
    request = await session(user)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/ticketing/tickets/{ticketId}/comments', expectedStatus, {
        ticketId: ticket.id,
      })
    }

    it('returns the index of Ticketing/Comments', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: ticketingComment.id,
        }),
      ])
    })

    context('TicketingComments created by another TicketingTicket', () => {
      it('are omitted', async () => {
        await createTicketingComment()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(ticketingComment: TicketingComment, expectedStatus: StatusCode) => {
      return request.get('/ticketing/tickets/{ticketId}/comments/{id}', expectedStatus, {
        ticketId: ticket.id,
        id: ticketingComment.id,
      })
    }

    it('returns the specified Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      const { body } = await show(ticketingComment, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: ticketingComment.id,
          body: ticketingComment.body,
        }),
      )
    })

    context('Ticketing/Comment created by another TicketingTicket', () => {
      it('is not found', async () => {
        const otherTicketingTicketTicketingComment = await createTicketingComment()

        await show(otherTicketingTicketTicketingComment, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/ticketing/tickets/{ticketId}/comments'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/ticketing/tickets/{ticketId}/comments', expectedStatus, {
        ticketId: ticket.id,
        data
      })
    }

    it('creates a Ticketing/Comment for this TicketingTicket', async () => {
      const { body } = await create({
        body: 'The Ticketing/Comment body',
      }, 201)

      const ticketingComment = await ticket.associationQuery('ticketingComments').firstOrFail()
      expect(ticketingComment.body).toEqual('The Ticketing/Comment body')

      expect(body).toEqual(
        expect.objectContaining({
          id: ticketingComment.id,
          body: ticketingComment.body,
        }),
      )
    })
  })

  describe('PATCH update', () => {
    const update = async <StatusCode extends 204 | 400 | 404>(
      ticketingComment: TicketingComment,
      data: RequestBody<'patch', '/ticketing/tickets/{ticketId}/comments/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/ticketing/tickets/{ticketId}/comments/{id}', expectedStatus, {
        ticketId: ticket.id,
        id: ticketingComment.id,
        data,
      })
    }

    it('updates the Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      await update(ticketingComment, {
        body: 'Updated Ticketing/Comment body',
      }, 204)

      await ticketingComment.reload()
      expect(ticketingComment.body).toEqual('Updated Ticketing/Comment body')
    })

    context('a Ticketing/Comment created by another TicketingTicket', () => {
      it('is not updated', async () => {
        const ticketingComment = await createTicketingComment()
        const originalBody = ticketingComment.body

        await update(ticketingComment, {
          body: 'Updated Ticketing/Comment body',
        }, 404)

        await ticketingComment.reload()
        expect(ticketingComment.body).toEqual(originalBody)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(ticketingComment: TicketingComment, expectedStatus: StatusCode) => {
      return request.delete('/ticketing/tickets/{ticketId}/comments/{id}', expectedStatus, {
        ticketId: ticket.id,
        id: ticketingComment.id,
      })
    }

    it('deletes the Ticketing/Comment', async () => {
      const ticketingComment = await createTicketingComment({ ticket })

      await destroy(ticketingComment, 204)

      expect(await TicketingComment.find(ticketingComment.id)).toBeNull()
    })

    context('a Ticketing/Comment created by another TicketingTicket', () => {
      it('is not deleted', async () => {
        const ticketingComment = await createTicketingComment()

        await destroy(ticketingComment, 404)

        expect(await TicketingComment.find(ticketingComment.id)).toMatchDreamModel(ticketingComment)
      })
    })
  })
})
`)
        })
      })
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
        forInternal: false,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
      })
      expect(res).toEqual(`\
import Article from '@models/Article.js'
import AdminUser from '@models/AdminUser.js'
import createArticle from '@spec/factories/ArticleFactory.js'
import createAdminUser from '@spec/factories/AdminUserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('Admin/ArticlesController', () => {
  let request: SpecRequestType
  let adminUser: AdminUser

  beforeEach(async () => {
    adminUser = await createAdminUser()
    request = await session(adminUser)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/admin/articles', expectedStatus)
    }

    it('returns the index of Articles', async () => {
      const article = await createArticle()

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: article.id,
        }),
      ])
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.get('/admin/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('returns the specified Article', async () => {
      const article = await createArticle()

      const { body } = await show(article, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: article.id,
          body: article.body,
        }),
      )
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/admin/articles'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/admin/articles', expectedStatus, {
        data
      })
    }

    it('creates a Article', async () => {
      const { body } = await create({
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
    const update = async <StatusCode extends 204 | 400 | 404>(
      article: Article,
      data: RequestBody<'patch', '/admin/articles/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/admin/articles/{id}', expectedStatus, {
        id: article.id,
        data,
      })
    }

    it('updates the Article', async () => {
      const article = await createArticle()

      await update(article, {
        body: 'Updated Article body',
      }, 204)

      await article.reload()
      expect(article.body).toEqual('Updated Article body')
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.delete('/admin/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('deletes the Article', async () => {
      const article = await createArticle()

      await destroy(article, 204)

      expect(await Article.find(article.id)).toBeNull()
    })
  })
})
`)
    })

    context('with an owning model specified', () => {
      it('uses the owning model for resource queries while authenticating as AdminUser', () => {
        const res = generateResourceControllerSpecContent({
          fullyQualifiedControllerName: 'Admin/ArticlesController',
          route: 'admin/articles',
          fullyQualifiedModelName: 'Article',
          columnsWithTypes: ['body:text'],
          owningModel: 'Organization',
          forAdmin: true,
          forInternal: false,
          singular: false,
          actions: [...RESOURCE_ACTIONS],
        })
        expect(res).toEqual(`\
import Article from '@models/Article.js'
import AdminUser from '@models/AdminUser.js'
import Organization from '@models/Organization.js'
import createArticle from '@spec/factories/ArticleFactory.js'
import createAdminUser from '@spec/factories/AdminUserFactory.js'
import createOrganization from '@spec/factories/OrganizationFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('Admin/ArticlesController', () => {
  let request: SpecRequestType
  let adminUser: AdminUser
  let organization: Organization

  beforeEach(async () => {
    adminUser = await createAdminUser()
    organization = await createOrganization({ adminUser })
    request = await session(adminUser)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/admin/articles', expectedStatus)
    }

    it('returns the index of Articles', async () => {
      const article = await createArticle({ organization })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: article.id,
        }),
      ])
    })

    context('Articles created by another Organization', () => {
      it('are omitted', async () => {
        await createArticle()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.get('/admin/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('returns the specified Article', async () => {
      const article = await createArticle({ organization })

      const { body } = await show(article, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: article.id,
          body: article.body,
        }),
      )
    })

    context('Article created by another Organization', () => {
      it('is not found', async () => {
        const otherOrganizationArticle = await createArticle()

        await show(otherOrganizationArticle, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/admin/articles'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/admin/articles', expectedStatus, {
        data
      })
    }

    it('creates a Article for this Organization', async () => {
      const { body } = await create({
        body: 'The Article body',
      }, 201)

      const article = await organization.associationQuery('articles').firstOrFail()
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
    const update = async <StatusCode extends 204 | 400 | 404>(
      article: Article,
      data: RequestBody<'patch', '/admin/articles/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/admin/articles/{id}', expectedStatus, {
        id: article.id,
        data,
      })
    }

    it('updates the Article', async () => {
      const article = await createArticle({ organization })

      await update(article, {
        body: 'Updated Article body',
      }, 204)

      await article.reload()
      expect(article.body).toEqual('Updated Article body')
    })

    context('a Article created by another Organization', () => {
      it('is not updated', async () => {
        const article = await createArticle()
        const originalBody = article.body

        await update(article, {
          body: 'Updated Article body',
        }, 404)

        await article.reload()
        expect(article.body).toEqual(originalBody)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.delete('/admin/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('deletes the Article', async () => {
      const article = await createArticle({ organization })

      await destroy(article, 204)

      expect(await Article.find(article.id)).toBeNull()
    })

    context('a Article created by another Organization', () => {
      it('is not deleted', async () => {
        const article = await createArticle()

        await destroy(article, 404)

        expect(await Article.find(article.id)).toMatchDreamModel(article)
      })
    })
  })
})
`)
      })
    })
  })

  context('an Internal controller', () => {
    it('replaces authenticates with the InternalUser, but created resources don\'t belong to the InternalUser', () => {
      const res = generateResourceControllerSpecContent({
        fullyQualifiedControllerName: 'Internal/ArticlesController',
        route: 'internal/articles',
        fullyQualifiedModelName: 'Article',
        columnsWithTypes: ['body:text'],
        forAdmin: false,
        forInternal: true,
        singular: false,
        actions: [...RESOURCE_ACTIONS],
      })
      expect(res).toEqual(`\
import Article from '@models/Article.js'
import InternalUser from '@models/InternalUser.js'
import createArticle from '@spec/factories/ArticleFactory.js'
import createInternalUser from '@spec/factories/InternalUserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('Internal/ArticlesController', () => {
  let request: SpecRequestType
  let internalUser: InternalUser

  beforeEach(async () => {
    internalUser = await createInternalUser()
    request = await session(internalUser)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/internal/articles', expectedStatus)
    }

    it('returns the index of Articles', async () => {
      const article = await createArticle()

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: article.id,
        }),
      ])
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.get('/internal/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('returns the specified Article', async () => {
      const article = await createArticle()

      const { body } = await show(article, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: article.id,
          body: article.body,
        }),
      )
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/internal/articles'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/internal/articles', expectedStatus, {
        data
      })
    }

    it('creates a Article', async () => {
      const { body } = await create({
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
    const update = async <StatusCode extends 204 | 400 | 404>(
      article: Article,
      data: RequestBody<'patch', '/internal/articles/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/internal/articles/{id}', expectedStatus, {
        id: article.id,
        data,
      })
    }

    it('updates the Article', async () => {
      const article = await createArticle()

      await update(article, {
        body: 'Updated Article body',
      }, 204)

      await article.reload()
      expect(article.body).toEqual('Updated Article body')
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.delete('/internal/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('deletes the Article', async () => {
      const article = await createArticle()

      await destroy(article, 204)

      expect(await Article.find(article.id)).toBeNull()
    })
  })
})
`)
    })

    context('with an owning model specified', () => {
      it('uses the owning model for resource queries while authenticating as InternalUser', () => {
        const res = generateResourceControllerSpecContent({
          fullyQualifiedControllerName: 'Internal/ArticlesController',
          route: 'internal/articles',
          fullyQualifiedModelName: 'Article',
          columnsWithTypes: ['body:text'],
          owningModel: 'Organization',
          forAdmin: false,
          forInternal: true,
          singular: false,
          actions: [...RESOURCE_ACTIONS],
        })
        expect(res).toEqual(`\
import Article from '@models/Article.js'
import InternalUser from '@models/InternalUser.js'
import Organization from '@models/Organization.js'
import createArticle from '@spec/factories/ArticleFactory.js'
import createInternalUser from '@spec/factories/InternalUserFactory.js'
import createOrganization from '@spec/factories/OrganizationFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'

describe('Internal/ArticlesController', () => {
  let request: SpecRequestType
  let internalUser: InternalUser
  let organization: Organization

  beforeEach(async () => {
    internalUser = await createInternalUser()
    organization = await createOrganization({ internalUser })
    request = await session(internalUser)
  })

  describe('GET index', () => {
    const index = async <StatusCode extends 200 | 400 | 404>(expectedStatus: StatusCode) => {
      return request.get('/internal/articles', expectedStatus)
    }

    it('returns the index of Articles', async () => {
      const article = await createArticle({ organization })

      const { body } = await index(200)

      expect(body.results).toEqual([
        expect.objectContaining({
          id: article.id,
        }),
      ])
    })

    context('Articles created by another Organization', () => {
      it('are omitted', async () => {
        await createArticle()

        const { body } = await index(200)

        expect(body.results).toEqual([])
      })
    })
  })

  describe('GET show', () => {
    const show = async <StatusCode extends 200 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.get('/internal/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('returns the specified Article', async () => {
      const article = await createArticle({ organization })

      const { body } = await show(article, 200)

      expect(body).toEqual(
        expect.objectContaining({
          id: article.id,
          body: article.body,
        }),
      )
    })

    context('Article created by another Organization', () => {
      it('is not found', async () => {
        const otherOrganizationArticle = await createArticle()

        await show(otherOrganizationArticle, 404)
      })
    })
  })

  describe('POST create', () => {
    const create = async <StatusCode extends 201 | 400 | 404>(
      data: RequestBody<'post', '/internal/articles'>,
      expectedStatus: StatusCode
    ) => {
      return request.post('/internal/articles', expectedStatus, {
        data
      })
    }

    it('creates a Article for this Organization', async () => {
      const { body } = await create({
        body: 'The Article body',
      }, 201)

      const article = await organization.associationQuery('articles').firstOrFail()
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
    const update = async <StatusCode extends 204 | 400 | 404>(
      article: Article,
      data: RequestBody<'patch', '/internal/articles/{id}'>,
      expectedStatus: StatusCode
    ) => {
      return request.patch('/internal/articles/{id}', expectedStatus, {
        id: article.id,
        data,
      })
    }

    it('updates the Article', async () => {
      const article = await createArticle({ organization })

      await update(article, {
        body: 'Updated Article body',
      }, 204)

      await article.reload()
      expect(article.body).toEqual('Updated Article body')
    })

    context('a Article created by another Organization', () => {
      it('is not updated', async () => {
        const article = await createArticle()
        const originalBody = article.body

        await update(article, {
          body: 'Updated Article body',
        }, 404)

        await article.reload()
        expect(article.body).toEqual(originalBody)
      })
    })
  })

  describe('DELETE destroy', () => {
    const destroy = async <StatusCode extends 204 | 400 | 404>(article: Article, expectedStatus: StatusCode) => {
      return request.delete('/internal/articles/{id}', expectedStatus, {
        id: article.id,
      })
    }

    it('deletes the Article', async () => {
      const article = await createArticle({ organization })

      await destroy(article, 204)

      expect(await Article.find(article.id)).toBeNull()
    })

    context('a Article created by another Organization', () => {
      it('is not deleted', async () => {
        const article = await createArticle()

        await destroy(article, 404)

        expect(await Article.find(article.id)).toMatchDreamModel(article)
      })
    })
  })
})
`)
      })
    })
  })

  context('importExtension is set on PsychicApp', () => {
    context('importExtension=.js', () => {
      beforeEach(() => {
        vi.spyOn(PsychicApp.prototype, 'importExtension', 'get').mockReturnValue('.js')
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.js')
      })

      it('styles all imports to have .js suffix', () => {
        const res = generateResourceControllerSpecContent({
          fullyQualifiedControllerName: 'V1/PostsController',
          route: 'v1/posts',
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: [],
          forAdmin: false,
          forInternal: false,
          singular: false,
          actions: [...RESOURCE_ACTIONS],
        })
        expect(res).toContain(
          `\
import Post from '@models/Post.js'
import User from '@models/User.js'
import createPost from '@spec/factories/PostFactory.js'
import createUser from '@spec/factories/UserFactory.js'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.js'\
`,
        )
      })
    })

    context('importExtension=.ts', () => {
      beforeEach(() => {
        vi.spyOn(PsychicApp.prototype, 'importExtension', 'get').mockReturnValue('.ts')
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.ts')
      })

      it('styles all imports to have .ts suffix', () => {
        const res = generateResourceControllerSpecContent({
          fullyQualifiedControllerName: 'V1/PostsController',
          route: 'v1/posts',
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: [],
          forAdmin: false,
          forInternal: false,
          singular: false,
          actions: [...RESOURCE_ACTIONS],
        })
        expect(res).toContain(
          `\
import Post from '@models/Post.ts'
import User from '@models/User.ts'
import createPost from '@spec/factories/PostFactory.ts'
import createUser from '@spec/factories/UserFactory.ts'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication.ts'\
`,
        )
      })
    })

    context('importExtension=none', () => {
      beforeEach(() => {
        vi.spyOn(PsychicApp.prototype, 'importExtension', 'get').mockReturnValue('none')
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('none')
      })

      it('styles all imports to have no suffix', () => {
        const res = generateResourceControllerSpecContent({
          fullyQualifiedControllerName: 'V1/PostsController',
          route: 'v1/posts',
          fullyQualifiedModelName: 'Post',
          columnsWithTypes: [],
          forAdmin: false,
          forInternal: false,
          singular: false,
          actions: [...RESOURCE_ACTIONS],
        })
        expect(res).toContain(
          `\
import Post from '@models/Post'
import User from '@models/User'
import createPost from '@spec/factories/PostFactory'
import createUser from '@spec/factories/UserFactory'
import { RequestBody, session, SpecRequestType } from '@spec/unit/helpers/authentication'\
`,
        )
      })
    })
  })
})
