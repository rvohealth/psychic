import { Encrypt } from '@rvoh/dream'
import { BeforeAction, OpenAPI } from '../../../../src.js'
import User from '../models/User.js'
import { CommentTestingBasicSerializerRefSerializer } from '../serializers/CommentSerializer.js'
import ApplicationController from './ApplicationController.js'

export default class UsersController extends ApplicationController {
  public ping() {
    this.ok(this.pingMessage)
  }

  // stubbed in feature specs
  public get pingMessage() {
    return 'helloworld'
  }

  public beforeAllTest() {
    this.ok(this.beforeAllTestContent)
  }

  @BeforeAction({ only: ['beforeActionSequence'] })
  public beforeActionSequence1() {
    this.send({ body: 'before action 1' })
  }

  @BeforeAction({ only: ['beforeActionSequence'] })
  public beforeActionSequence2() {
    this.send({ body: 'before action 2' })
  }

  public beforeActionSequence() {
    this.ok('no before actions run')
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
    this.created(user)
  }

  @OpenAPI(User, {
    status: 200,
    many: true,
    serializerKey: 'extra',
  })
  public async index() {
    const users = await User.all()
    this.ok(users)
  }

  @OpenAPI(User, {
    status: 200,
    serializerKey: 'withPosts',
  })
  public async show() {
    const user = await User.findOrFail(this.castParam('id', 'bigint'))
    this.ok(user)
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
    const user = await User.findBy({ email: this.castParam('email', 'string') })
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
