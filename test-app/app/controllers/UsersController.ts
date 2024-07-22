import { Encrypt } from '../../../src'
import { BeforeAction, Openapi } from '../../../src/controller/decorators'
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

  @Openapi(() => User, {
    path: '/users',
    method: 'post',
    status: 201,
    serializerKey: 'extra',
  })
  public async create() {
    const user = await User.create(this.userParams)
    this.created(user)
  }

  @Openapi(() => User, {
    path: '/users',
    method: 'get',
    status: 200,
    many: true,
    serializerKey: 'extra',
  })
  public async index() {
    const users = await User.all()
    this.ok(users)
  }

  @Openapi(() => User, {
    path: '/users/{id}',
    method: 'get',
    status: 200,
    serializerKey: 'withPosts',
  })
  public async show() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    this.ok(user)
  }

  @Openapi({
    path: '/users/{id}',
  })
  public async destroy() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    await user.destroy()
    this.noContent()
  }

  public hello() {
    this.ok(`world ${this.param('id')}`)
  }

  public async login() {
    const user = await User.findBy({ email: this.param('email') })
    if (!user || !(await user.checkPassword(this.param('password')))) this.notFound()

    await this.startSession(user!)

    // this token is used for authenticating via websockets during tests. for more info,
    // see spec/features/visitor/websockets.spec.ts
    const token = Encrypt.sign(user!.id.toString())

    this.ok(token)
  }

  @BeforeAction()
  public setBeforeAllTestContent() {
    this.beforeAllTestContent = 'before all action was called for all!'
  }
  public beforeAllTestContent = 'before all action was NOT called for all'

  private get userParams() {
    return this.paramsFor(User, { key: 'user' })
  }
}
