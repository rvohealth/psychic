import { BeforeCreate, BeforeUpdate } from 'dream'
import HowlController from '../../../src/controller'
import Params from '../../../src/server/params'
import User from '../models/user'

export default class UsersController extends HowlController {
  static {
    this.before('authenticate', { only: ['authPing'] })
  }

  public ping() {
    this.ok('helloworld')
  }

  public authPing() {
    this.ok('authed')
  }

  public async create() {
    const user = await User.create(this.userParams)
    this.ok(user)
  }

  public async index() {
    const users = await User.all()
    this.ok(users)
  }

  public async login() {
    const user = await User.findBy({ email: this.params.email })
    if (!user || !(await user.checkPassword(this.params.password))) this.notFound()

    await this.startSession(user)
    this.ok()
  }

  private get userParams() {
    return Params.restrict(this.params?.user, ['email', 'password'])
  }
}
