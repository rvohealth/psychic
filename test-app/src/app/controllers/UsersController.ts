import { Encrypt } from '@rvohealth/dream'
import { BeforeAction, OpenAPI } from '../../../../src'
import User from '../models/User'
import { CommentTestingBasicSerializerRefSerializer } from '../serializers/CommentSerializer'
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

  @OpenAPI(User, {
    status: 201,
    serializerKey: 'extra',
  })
  public async create() {
    const user = await User.create(this.userParams)
    this.created(user, { serializerKey: 'extra' })
  }

  @OpenAPI(User, {
    status: 200,
    many: true,
    serializerKey: 'extra',
  })
  public async index() {
    const users = await User.all()
    this.ok(users, { serializerKey: 'extra' })
  }

  @OpenAPI(User, {
    status: 200,
    serializerKey: 'withPosts',
  })
  public async show() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    this.ok(user, { serializerKey: 'withPosts' })
  }

  @OpenAPI(User, {
    status: 204,
    pathParams: { id: { description: 'The ID of the User' } },
  })
  public async update() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    await user.update(this.paramsFor(User))
    this.ok(user)
  }

  @OpenAPI()
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

    this.startSession(user!)

    // this token is used for authenticating via websockets during tests. for more info,
    // see spec/features/visitor/websockets.spec.ts
    const token = Encrypt.encrypt(user!.id.toString(), {
      algorithm: 'aes-256-gcm',
      key: process.env.APP_ENCRYPTION_KEY!,
    })

    this.ok(token)
  }

  @OpenAPI({
    status: 200,
    responses: {
      200: {
        $serializer: CommentTestingBasicSerializerRefSerializer,
      },
    },
  })
  public justforspecs() {}

  public howyadoin() {
    this.noContent()
  }

  public doathing() {
    this.noContent()
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
