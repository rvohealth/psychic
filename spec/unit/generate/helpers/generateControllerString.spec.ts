import generateControllerString from '../../../../src/generate/helpers/generateControllerString'

describe('psy generate:controller <name> [...methods]', () => {
  context('when provided methods', () => {
    context('when controller matches a pluralized version of a model', () => {
      it('generates a controller adding requested methods, and autofilling those matching standard crud names', async () => {
        const res = await generateControllerString('users', [
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
import User from 'app/models/user'

export default class UsersController extends PsychicController {
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
  })

  context('when provided with a nested path', () => {
    it('generates a controller with pascal-cased naming', async () => {
      const res = await generateControllerString('api/v1/users')

      expect(res).toEqual(
        `\
import { PsychicController, Params } from 'psychic'

export default class ApiV1UsersController extends PsychicController {

}\
`
      )
    })
  })
})
