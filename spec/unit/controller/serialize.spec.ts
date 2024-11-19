import { getMockReq, getMockRes } from '@jest-mock/express'
import { Attribute, DreamApplication, DreamSerializer } from '@rvohealth/dream'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller'
import { BeforeAction, OpenAPI } from '../../../src/controller/decorators'
import PsychicApplication from '../../../src/psychic-application'
import Pet from '../../../test-app/src/app/models/Pet'
import User from '../../../test-app/src/app/models/User'
import UserSerializer, {
  UserExtraSerializer,
  UserSummarySerializer,
} from '../../../test-app/src/app/serializers/UserSerializer'

describe('PsychicController', () => {
  describe('#serialize', () => {
    let req: Request
    let res: Response
    let config: PsychicApplication

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      res = getMockRes().res
      config = new PsychicApplication()
      jest.spyOn(res, 'json')
    })

    it('serializes the data using the provided serializer', async () => {
      class MySerializer extends DreamSerializer {
        @Attribute()
        public email: string
      }

      const dreamApp = DreamApplication.getOrFail()
      jest.spyOn(dreamApp, 'serializers', 'get').mockReturnValue({
        ...dreamApp.serializers,
        MySerializer,
      })

      jest.spyOn(DreamApplication, 'getOrFail').mockReturnValue(dreamApp)

      class MyController extends PsychicController {
        static {
          this.serializes(User).with(MySerializer)
        }

        public async show() {
          this.ok(await User.first())
        }
      }

      await User.create({ email: 'how@yadoin', passwordDigest: 'hello' })
      const controller = new MyController(req, res, { config, action: 'show' })

      await controller.show()
      expect(res.json).toHaveBeenCalledWith({ email: 'how@yadoin' })
    })

    context('without a serializer explicitly bound to the controller', () => {
      it('identifies serializer attached to model class and uses it to serialize', async () => {
        class MyController extends PsychicController {
          public async index() {
            this.ok([...(await User.all()), ...(await Pet.all())], { serializerKey: 'summary' })
          }

          public async show() {
            this.ok(await User.first())
          }
        }

        const user1 = await User.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
        const user2 = await User.create({ email: 'zed@zed', name: 'zed', passwordDigest: 'hello' })
        const controller1 = new MyController(req, res, { config, action: 'index' })

        await controller1.index()
        expect(res.json).toHaveBeenCalledWith([{ id: user1.id }, { id: user2.id }])

        jest.spyOn(res, 'json').mockReset()

        const controller2 = new MyController(req, res, { config, action: 'show' })
        await controller2.show()
        expect(res.json).toHaveBeenCalledWith({ id: user1.id, email: 'how@yadoin', name: 'fred' })
      })

      context('when the serializer is specified in the OpenAPI decorator', () => {
        it('identifies serializer attached to model class and uses it to serialize', async () => {
          class MyController extends PsychicController {
            @OpenAPI([User, Pet], {
              serializerKey: 'summary',
            })
            public async index() {
              this.ok([...(await User.all()), ...(await Pet.all())])
            }
          }

          const user1 = await User.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
          const user2 = await User.create({ email: 'zed@zed', name: 'zed', passwordDigest: 'hello' })
          const controller = new MyController(req, res, { config, action: 'index' })

          await controller.index()
          expect(res.json).toHaveBeenCalledWith([{ id: user1.id }, { id: user2.id }])
        })
      })

      context('when the model is not a Dream', () => {
        class GreetSerializer extends DreamSerializer {
          @Attribute()
          public greeting(): string {
            return `${(this.$data as Greeting).word} world`
          }
        }

        class GreetSerializer2 extends DreamSerializer {
          @Attribute()
          public greeting(): string {
            return `${(this.$data as Greeting).word} goodbye`
          }
        }

        class Greeting {
          public word: string

          constructor(word: string) {
            this.word = word
          }

          public get serializers() {
            return { default: 'GreetSerializer' } as const
          }
        }

        class Greeting2 {
          public word: string

          constructor(word: string) {
            this.word = word
          }

          public get serializers() {
            return { default: 'GreetSerializer2' } as const
          }
        }

        class MyController extends PsychicController {
          public index() {
            this.ok([new Greeting('hello'), new Greeting('howdy')])
          }

          public show() {
            this.ok(new Greeting('hello'))
          }
        }

        beforeEach(() => {
          const dreamApp = DreamApplication.getOrFail()
          jest.spyOn(dreamApp, 'serializers', 'get').mockReturnValue({
            ...dreamApp.serializers,
            GreetSerializer,
            GreetSerializer2,
          })

          jest.spyOn(DreamApplication, 'getOrFail').mockReturnValue(dreamApp)
        })

        it('identifies serializer attached to model class and uses it to serialize the object', () => {
          const controller = new MyController(req, res, { config, action: 'show' })
          controller.show()
          expect(res.json).toHaveBeenCalledWith({ greeting: 'hello world' })
        })

        it('identifies serializer attached to model class and uses it to serialize each object in an array', () => {
          const controller = new MyController(req, res, { config, action: 'show' })
          controller.index()
          expect(res.json).toHaveBeenCalledWith([{ greeting: 'hello world' }, { greeting: 'howdy world' }])
        })

        context('with instances of different classes', () => {
          class MyController2 extends PsychicController {
            public index() {
              this.ok([new Greeting('hello'), new Greeting2('hello')])
            }
          }

          it('allows rendering of different types in the same array', () => {
            const controller = new MyController2(req, res, { config, action: 'show' })
            controller.index()
            expect(res.json).toHaveBeenCalledWith([
              { greeting: 'hello world' },
              { greeting: 'hello goodbye' },
            ])
          })
        })
      })
    })

    context('with default passthrough data set on the controller', () => {
      class User2 extends User {
        public get serializers() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            default: 'User2Serializer',
            summary: 'User2SummarySerializer',
            extra: 'User2ExtraSerializer',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      }

      class User2Serializer extends UserSerializer {
        @Attribute()
        public howyadoin() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          return this.passthroughData.howyadoin
        }
      }

      class User2SummarySerializer extends UserSummarySerializer {
        @Attribute()
        public howyadoin() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          return this.passthroughData.howyadoin
        }
      }

      class User2ExtraSerializer extends UserExtraSerializer {
        @Attribute()
        public howyadoin() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          return this.passthroughData.howyadoin
        }
      }

      class MyController extends PsychicController {
        public async show() {
          this.ok(await User2.first())
        }

        @BeforeAction()
        public configure() {
          this.serializerPassthrough({ howyadoin: 'howyadoin' })
        }
      }

      let user2: User2

      beforeEach(async () => {
        user2 = await User2.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
        const dreamApp = DreamApplication.getOrFail()
        jest.spyOn(dreamApp, 'serializers', 'get').mockReturnValue({
          ...dreamApp.serializers,
          User2Serializer,
          User2SummarySerializer,
          User2ExtraSerializer,
        })

        jest.spyOn(DreamApplication, 'getOrFail').mockReturnValue(dreamApp)
      })

      it('passes the passthrough data through to the child serializers', async () => {
        const controller = new MyController(req, res, { config, action: 'show' })

        await controller.runAction('show')
        expect(res.json).toHaveBeenCalledWith({
          id: user2.id,
          email: 'how@yadoin',
          name: 'fred',
          howyadoin: 'howyadoin',
        })

        await controller.show()
      })
    })
  })
})
