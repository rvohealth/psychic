import generateControllerContent from '../../../../src/generate/helpers/generateControllerContent'

describe('psy generate:controller <name> [...methods]', () => {
  context('when provided methods', () => {
    context('passing a model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerContent('ApiV1PostsController', 'posts', 'Post', [
          'create',
          'index',
          'show',
          'update',
          'destroy',
          'preview',
        ])

        expect(res).toEqual(
          `\
import { Openapi } from '@rvohealth/psychic'
import AuthedController from './AuthedController'
import Post from '../models/Post'

export default class ApiV1PostsController extends AuthedController {
  @Openapi(() => Post, { status: 201 })
  public async create() {
    //    const post = await this.currentUser.createAssociation('posts', this.paramsFor(Post))
    //    this.created(post)
  }

  @Openapi(() => Post, {
    status: 200,
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const posts = await this.currentUser.associationQuery('posts').all()
    //    this.ok(posts)
  }

  @Openapi(() => Post, { status: 200 })
  public async show() {
    //    const post = await this.post()
    //    this.ok(post)
  }

  @Openapi({ status: 204 })
  public async update() {
    //    const post = await this.post()
    //    await post.update(this.paramsFor(Post))
    //    this.noContent()
  }

  @Openapi({ status: 204 })
  public async destroy() {
    //    const post = await this.post()
    //    await post.destroy()
    //    this.noContent()
  }

  @Openapi({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async preview() {
  }

  private async post() {
    return await this.currentUser.associationQuery('posts').findOrFail(
      this.castParam('id', 'string')
    )
  }
}\
`,
        )
      })
    })

    context('passing a namespaced model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerContent(
          'ApiV1HealthPostsController',
          '/api/v1/health/posts',
          'Health/Post',
          ['create', 'index', 'show', 'update', 'destroy', 'preview'],
        )

        expect(res).toEqual(
          `\
import { Openapi } from '@rvohealth/psychic'
import AuthedController from '../../../AuthedController'
import HealthPost from '../../../../models/Health/Post'

export default class ApiV1HealthPostsController extends AuthedController {
  @Openapi(() => HealthPost, { status: 201 })
  public async create() {
    //    const healthPost = await this.currentUser.createAssociation('healthPosts', this.paramsFor(HealthPost))
    //    this.created(healthPost)
  }

  @Openapi(() => HealthPost, {
    status: 200,
    many: true,
    serializerKey: 'summary',
  })
  public async index() {
    //    const healthPosts = await this.currentUser.associationQuery('healthPosts').all()
    //    this.ok(healthPosts)
  }

  @Openapi(() => HealthPost, { status: 200 })
  public async show() {
    //    const healthPost = await this.healthPost()
    //    this.ok(healthPost)
  }

  @Openapi({ status: 204 })
  public async update() {
    //    const healthPost = await this.healthPost()
    //    await healthPost.update(this.paramsFor(HealthPost))
    //    this.noContent()
  }

  @Openapi({ status: 204 })
  public async destroy() {
    //    const healthPost = await this.healthPost()
    //    await healthPost.destroy()
    //    this.noContent()
  }

  @Openapi({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async preview() {
  }

  private async healthPost() {
    return await this.currentUser.associationQuery('healthPosts').findOrFail(
      this.castParam('id', 'string')
    )
  }
}\
`,
        )
      })

      context('the path is within the admin namespace', () => {
        it('generates a controller using', () => {
          const res = generateControllerContent(
            'Admin/NutritionLogEntriesController',
            'admin/nutrition-log-entries',
            'Nutrition/LogEntry',
            ['create'],
          )

          expect(res).toEqual(
            `\
import { Openapi } from '@rvohealth/psychic'
import AdminAuthedController from '../Admin/AuthedController'
import NutritionLogEntry from '../../models/Nutrition/LogEntry'

export default class AdminNutritionLogEntriesController extends AdminAuthedController {
  @Openapi(() => NutritionLogEntry, { status: 201 })
  public async create() {
    //    const nutritionLogEntry = await this.currentUser.createAssociation('nutritionLogEntries', this.paramsFor(NutritionLogEntry))
    //    this.created(nutritionLogEntry)
  }
}`,
          )
        })
      })
    })

    context('when provided with a nested path', () => {
      it('generates a controller with pascal-cased naming', () => {
        const res = generateControllerContent('ApiV1UsersController', 'api/v1/users', null, [
          'hello',
          'world',
        ])

        expect(res).toEqual(
          `\
import { Openapi } from '@rvohealth/psychic'
import AuthedController from '../../AuthedController'

export default class ApiV1UsersController extends AuthedController {
  @Openapi({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async hello() {
  }

  @Openapi({
    response: {
      200: {
        // add openapi definition for your custom endpoint
      }
    }
  })
  public async world() {
  }
}`,
        )
      })
    })
  })
})
