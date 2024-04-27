import { BeforeAction } from '../../../src/controller/decorators'
import Params from '../../../src/server/params'
import User from '../models/User'
import ApplicationController from './ApplicationController'

export default class UsersController extends ApplicationController {
  public ping() {
    this.ok('helloworld')
  }

  public beforeAllTest() {
    this.ok(this.beforeAllTestContent)
  }

  public async failedToSaveTest() {
    await User.create({ email: 'invalidemail', password: 'howyadoin' })
  }

  public forceThrow() {
    throw new Error('this should force a 500')
  }

  public async create() {
    const user = await User.create(this.userParams)
    this.created(user)
  }

  public async index() {
    const users = await User.all()
    this.ok(users)
  }

  public hello() {
    this.ok(`world ${this.param('id')}`)
  }

  public async login() {
    const user = await User.findBy({ email: this.param('email') })
    if (!user || !(await user.checkPassword(this.param('password')))) this.notFound()

    await this.startSession(user!)
    this.ok()
  }

  @BeforeAction()
  public setBeforeAllTestContent() {
    this.beforeAllTestContent = 'before all action was called for all!'
  }
  public beforeAllTestContent = 'before all action was NOT called for all'

  private get userParams() {
    return this.paramsFor(User, 'user')
  }
}
