import generateControllerString from '../../../../src/generate/helpers/generateControllerString'

describe('psy generate:controller <name> [...methods]', () => {
  context('when provided methods', () => {
    context('passing a model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerString(
          'ApiV1UsersController',
          'users',
          'User',
          ['create', 'index', 'show', 'update', 'destroy', 'login'],
          ['id', 'name', 'email', 'password_digest', 'created_at', 'updated_at']
        )

        expect(res).toEqual(
          `\
import { Params } from '@rvohealth/psychic'
import AuthedController from './AuthedController'
import User from '../models/User'

export default class ApiV1UsersController extends AuthedController {
  public async create() {
    //    const user = await User.create(this.userParams)
    //    this.created(user)
  }

  public async index() {
    //    const users = await User.all()
    //    this.ok(users)
  }

  public async show() {
    //    const user = await User.find(this.params.id)
    //    this.ok(user)
  }

  public async update() {
    //    const user = await User.find(this.params.id)
    //    await user.update(this.userParams)
    //    this.noContent()
  }

  public async destroy() {
    //    const user = await User.find(this.params.id)
    //    await user.destroy()
    //    this.noContent()
  }

  public async login() {
  }

  private get userParams() {
    return this.paramsFor(User)
  }
}\
`
        )
      })
    })

    context('passing a namespaced model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', () => {
        const res = generateControllerString(
          'ApiV1HealthUsersController',
          '/api/v1/health/users',
          'Health/User',
          ['create', 'index', 'show', 'update', 'destroy', 'login'],
          ['id', 'name', 'email', 'password_digest', 'created_at', 'updated_at']
        )

        expect(res).toEqual(
          `\
import { Params } from '@rvohealth/psychic'
import AuthedController from '../../../AuthedController'
import User from '../../../../models/Health/User'

export default class ApiV1HealthUsersController extends AuthedController {
  public async create() {
    //    const user = await User.create(this.userParams)
    //    this.created(user)
  }

  public async index() {
    //    const users = await User.all()
    //    this.ok(users)
  }

  public async show() {
    //    const user = await User.find(this.params.id)
    //    this.ok(user)
  }

  public async update() {
    //    const user = await User.find(this.params.id)
    //    await user.update(this.userParams)
    //    this.noContent()
  }

  public async destroy() {
    //    const user = await User.find(this.params.id)
    //    await user.destroy()
    //    this.noContent()
  }

  public async login() {
  }

  private get userParams() {
    return this.paramsFor(User)
  }
}\
`
        )
      })

      context('the path is within the admin namespace', () => {
        it('generates a controller using', () => {
          const res = generateControllerString(
            'Admin/NutritionLogEntriesController',
            'admin/nutrition-log-entries',
            'Nutrition/LogEntry',
            ['create'],
            ['id', 'calories']
          )

          expect(res).toEqual(
            `\
import { Params } from '@rvohealth/psychic'
import AdminAuthedController from '../Admin/AuthedController'
import LogEntry from '../../models/Nutrition/LogEntry'

export default class AdminNutritionLogEntriesController extends AdminAuthedController {
  public async create() {
    //    const logEntry = await LogEntry.create(this.logEntryParams)
    //    this.created(logEntry)
  }

  private get logEntryParams() {
    return this.paramsFor(LogEntry)
  }
}`
          )
        })
      })
    })

    context('when provided with a nested path', () => {
      it('generates a controller with pascal-cased naming', () => {
        const res = generateControllerString('ApiV1UsersController', 'api/v1/users', null, ['hello', 'world'])

        expect(res).toEqual(
          `\
import { Params } from '@rvohealth/psychic'
import AuthedController from '../../AuthedController'

export default class ApiV1UsersController extends AuthedController {
  public async hello() {
  }

  public async world() {
  }
}`
        )
      })
    })
  })
})
