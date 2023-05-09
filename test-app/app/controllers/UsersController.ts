import Params from '../../../src/server/params'
import User from '../models/User'
import ApplicationController from './ApplicationController'

export default class UsersController extends ApplicationController {
  static {
    this.before('authenticate', { only: ['authPing'] })
    this.before('setBeforeAllTestContent')
  }

  public ping() {
    this.ok('helloworld')
  }

  public authPing() {
    this.ok('authed')
  }

  public beforeAllTest() {
    this.ok(this.beforeAllTestContent)
  }

  public async failedToSaveTest() {
    // @ts-ignore
    await User.create({ email: 'how@yadoin', password: 'howyadoin', created_at: 'invalid date' })
  }

  public async create() {
    const user = await User.create(this.userParams)
    this.created(user)
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

  public beforeAllTestContent = 'before all action was NOT called for all'
  public setBeforeAllTestContent() {
    this.beforeAllTestContent = 'before all action was called for all!'
  }

  private get userParams() {
    return Params.restrict(this.params?.user, ['email', 'password'])
  }
}
