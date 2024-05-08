import generateControllerString from '../../../../src/generate/helpers/generateControllerString'

describe('psy generate:controller <name> [...methods]', () => {
  context('when provided methods', () => {
    context('passing a model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerString('ApiV1PostsController', 'posts', 'Post', [
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
    //    const post = await this.currentUser.associationQuery('posts').find(this.param<string>('id'))
    //    this.ok(post)
  }

  public async update() {
    //    const post = await this.currentUser.associationQuery('posts').find(this.param<string>('id'))
    //    await post.update(this.paramsFor(Post))
    //    this.noContent()
  }

  public async destroy() {
    //    const post = await this.currentUser.associationQuery('posts').find(this.param<string>('id'))
    //    await post.destroy()
    //    this.noContent()
  }

  public async preview() {
  }
}\
`,
        )
      })
    })

    context('passing a namespaced model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerString(
          'ApiV1HealthPostsController',
          '/api/v1/health/posts',
          'Health/Post',
          ['create', 'index', 'show', 'update', 'destroy', 'preview'],
        )

        expect(res).toEqual(
          `\
import AuthedController from '../../../AuthedController'
import Post from '../../../../models/Health/Post'

export default class ApiV1HealthPostsController extends AuthedController {
  public async create() {
    //    const post = await this.currentUser.createAssociation('posts', this.paramsFor(Post))
    //    this.created(post)
  }

  public async index() {
    //    const posts = await this.currentUser.associationQuery('posts').all()
    //    this.ok(posts)
  }

  public async show() {
    //    const post = await this.currentUser.associationQuery('posts').find(this.param<string>('id'))
    //    this.ok(post)
  }

  public async update() {
    //    const post = await this.currentUser.associationQuery('posts').find(this.param<string>('id'))
    //    await post.update(this.paramsFor(Post))
    //    this.noContent()
  }

  public async destroy() {
    //    const post = await this.currentUser.associationQuery('posts').find(this.param<string>('id'))
    //    await post.destroy()
    //    this.noContent()
  }

  public async preview() {
  }
}\
`,
        )
      })

      context('the path is within the admin namespace', () => {
        it('generates a controller using', () => {
          const res = generateControllerString(
            'Admin/NutritionLogEntriesController',
            'admin/nutrition-log-entries',
            'Nutrition/LogEntry',
            ['create'],
          )

          expect(res).toEqual(
            `\
import AdminAuthedController from '../Admin/AuthedController'
import LogEntry from '../../models/Nutrition/LogEntry'

export default class AdminNutritionLogEntriesController extends AdminAuthedController {
  public async create() {
    //    const logEntry = await this.currentUser.createAssociation('logEntries', this.paramsFor(LogEntry))
    //    this.created(logEntry)
  }
}`,
          )
        })
      })
    })

    context('when provided with a nested path', () => {
      it('generates a controller with pascal-cased naming', () => {
        const res = generateControllerString('ApiV1UsersController', 'api/v1/users', null, ['hello', 'world'])

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
