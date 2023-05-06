import generateControllerString from '../../../../src/generate/helpers/generateControllerString'

describe('psy generate:controller <name> [...methods]', () => {
  context('when provided methods', () => {
    context('passing a model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', async () => {
        const res = await generateControllerString('api/V1/users', 'ApiV1UsersController', 'User', [
          'create',
          'index',
          'show',
          'update',
          'destroy',
          'login',
        ])

        expect(res).toEqual(
          `\
import { PsychicController, Params } from 'psychic'
import User from '../../../models/User'

export default class ApiV1UsersController extends PsychicController {
  public async create() {
    const user = await User.create(this.userParams)
    this.ok(user)
  }

  public async index() {
    const users = await User.all()
    this.ok(users)
  }

  public async show() {
    const user = await User.find(this.params.id)
    this.ok(user)
  }

  public async update() {
    const user = await User.find(this.params.id)
    await user.update(this.userParams)
    this.ok(user)
  }

  public async destroy() {
    const user = await User.find(this.params.id)
    await user.destroy()
    this.ok()
  }

  public async login() {
  }

  private get userParams() {
    return Params.restrict(this.params?.user, ['id', 'name', 'email', 'password_digest', 'created_at', 'updated_at'])
  }
}\
`
        )
      })
    })

    context('passing a namespaced model and a path', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', async () => {
        const res = await generateControllerString(
          'api/v1/health/users',
          'ApiV1HealthUsersController',
          'Health/User',
          ['create', 'index', 'show', 'update', 'destroy', 'login']
        )

        expect(res).toEqual(
          `\
import { PsychicController, Params } from 'psychic'
import User from '../../../../models/Health/User'

export default class ApiV1HealthUsersController extends PsychicController {
  public async create() {
    const user = await User.create(this.userParams)
    this.ok(user)
  }

  public async index() {
    const users = await User.all()
    this.ok(users)
  }

  public async show() {
    const user = await User.find(this.params.id)
    this.ok(user)
  }

  public async update() {
    const user = await User.find(this.params.id)
    await user.update(this.userParams)
    this.ok(user)
  }

  public async destroy() {
    const user = await User.find(this.params.id)
    await user.destroy()
    this.ok()
  }

  public async login() {
  }

  private get healthUserParams() {
    return Params.restrict(this.params?.healthUser, ['id', 'email', 'password_digest', 'name', 'created_at', 'updated_at'])
  }
}\
`
        )
      })
    })
  })

  context('when provided with a nested path', () => {
    it('generates a controller with pascal-cased naming', async () => {
      const res = await generateControllerString('api/v1/users', 'ApiV1UsersController', null, [
        'hello',
        'world',
      ])

      expect(res).toEqual(
        `\
import { PsychicController, Params } from 'psychic'

export default class ApiV1UsersController extends PsychicController {
  public async hello() {
  }

  public async world() {
  }
}\
`
      )
    })
  })
})
