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
import AuthedController from './AuthedController'
import Post from '../models/Post'

export default class ApiV1PostsController extends AuthedController {
  public async create() {
    //    const post = await this.currentUser.createAssociation('posts', this.paramsFor(Post))
    //    this.created(post)
  }

  public async index() {
    //    const posts = await this.currentUser.associationQuery('posts').all()
    //    this.ok(posts)
  }

  public async show() {
    //    const post = await this.post()
    //    this.ok(post)
  }

  public async update() {
    //    const post = await this.post()
    //    await post.update(this.paramsFor(Post))
    //    this.noContent()
  }

  public async destroy() {
    //    const post = await this.post()
    //    await post.destroy()
    //    this.noContent()
  }

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
import AuthedController from '../../../AuthedController'
import HealthPost from '../../../../models/Health/Post'

export default class ApiV1HealthPostsController extends AuthedController {
  public async create() {
    //    const healthPost = await this.currentUser.createAssociation('healthPosts', this.paramsFor(HealthPost))
    //    this.created(healthPost)
  }

  public async index() {
    //    const healthPosts = await this.currentUser.associationQuery('healthPosts').all()
    //    this.ok(healthPosts)
  }

  public async show() {
    //    const healthPost = await this.healthPost()
    //    this.ok(healthPost)
  }

  public async update() {
    //    const healthPost = await this.healthPost()
    //    await healthPost.update(this.paramsFor(HealthPost))
    //    this.noContent()
  }

  public async destroy() {
    //    const healthPost = await this.healthPost()
    //    await healthPost.destroy()
    //    this.noContent()
  }

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
import AdminAuthedController from '../Admin/AuthedController'
import NutritionLogEntry from '../../models/Nutrition/LogEntry'

export default class AdminNutritionLogEntriesController extends AdminAuthedController {
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
import AuthedController from '../../AuthedController'

export default class ApiV1UsersController extends AuthedController {
  public async hello() {
  }

  public async world() {
  }
}`,
        )
      })
    })
  })
})
