import { getMockReq, getMockRes } from '@jest-mock/express'
import { DreamApp, ObjectSerializer } from '@rvoh/dream'
import { Request, Response } from 'express'
import { MockInstance } from 'vitest'
import { BeforeAction, OpenAPI } from '../../../src/controller/decorators.js'
import PsychicController from '../../../src/controller/index.js'
import * as toJsonModule from '../../../src/helpers/toJson.js'
import Pet from '../../../test-app/src/app/models/Pet.js'
import User from '../../../test-app/src/app/models/User.js'
import UserSerializer, {
  UserExtraSerializer,
  UserSummarySerializer,
} from '../../../test-app/src/app/serializers/UserSerializer.js'
import processDynamicallyDefinedControllers from '../../helpers/processDynamicallyDefinedControllers.js'

describe('PsychicController', () => {
  describe('#serialize', () => {
    let req: Request
    let res: Response
    let toJsonSpy: MockInstance

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } }) as unknown as Request
      res = getMockRes().res as unknown as Response
      toJsonSpy = vi.spyOn(toJsonModule, 'default')
    })

    it('identifies serializer attached to model class and uses it to serialize', async () => {
      class MyController extends PsychicController {
        public async index() {
          this.ok([...(await User.all()), ...(await Pet.all())], { serializerKey: 'summary' })
        }

        public async show() {
          this.ok(await User.first())
        }
      }
      processDynamicallyDefinedControllers(MyController)

      const user1 = await User.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
      const user2 = await User.create({ email: 'zed@zed', name: 'zed', passwordDigest: 'hello' })
      const controller1 = new MyController(req, res, { action: 'index' })

      await controller1.index()
      expect(toJsonSpy).toHaveBeenCalledWith([{ id: user1.id }, { id: user2.id }], false)

      toJsonSpy.mockReset()

      const controller2 = new MyController(req, res, { action: 'show' })
      await controller2.show()
      expect(toJsonSpy).toHaveBeenCalledWith({ id: user1.id, email: 'how@yadoin', name: 'fred' }, false)
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
        processDynamicallyDefinedControllers(MyController)

        const user1 = await User.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
        const user2 = await User.create({ email: 'zed@zed', name: 'zed', passwordDigest: 'hello' })
        const controller = new MyController(req, res, { action: 'index' })

        await controller.index()
        expect(toJsonSpy).toHaveBeenCalledWith([{ id: user1.id }, { id: user2.id }], false)
      })
    })

    context('when the model is not a Dream', () => {
      const GreetSerializer = (data: Greeting) =>
        ObjectSerializer(data).customAttribute('greeting', () => `${data.word} world`, {
          openapi: 'string',
        })

      const GreetSerializer2 = (data: Greeting2) =>
        ObjectSerializer(data).customAttribute('greeting', () => `${data.word} goodbye`, {
          openapi: 'string',
        })

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
      processDynamicallyDefinedControllers(MyController)

      beforeEach(() => {
        const dreamApp = DreamApp.getOrFail()
        vi.spyOn(dreamApp, 'serializers', 'get').mockReturnValue({
          ...dreamApp.serializers,
          GreetSerializer,
          GreetSerializer2,
        })

        vi.spyOn(DreamApp, 'getOrFail').mockReturnValue(dreamApp)
      })

      it('identifies serializer attached to model class and uses it to serialize the object', () => {
        const controller = new MyController(req, res, { action: 'show' })
        controller.show()
        expect(toJsonSpy).toHaveBeenCalledWith({ greeting: 'hello world' }, false)
      })

      it('identifies serializer attached to model class and uses it to serialize each object in an array', () => {
        const controller = new MyController(req, res, { action: 'show' })
        controller.index()
        expect(toJsonSpy).toHaveBeenCalledWith(
          [{ greeting: 'hello world' }, { greeting: 'howdy world' }],
          false,
        )
      })

      context('with instances of different classes', () => {
        class MyController2 extends PsychicController {
          public index() {
            this.ok([new Greeting('hello'), new Greeting2('hello')])
          }
        }

        it('allows rendering of different types in the same array', () => {
          const controller = new MyController2(req, res, { action: 'show' })
          controller.index()
          expect(toJsonSpy).toHaveBeenCalledWith(
            [{ greeting: 'hello world' }, { greeting: 'hello goodbye' }],
            false,
          )
        })
      })

      context('with instances of serializers', () => {
        class MyController2 extends PsychicController {
          public index() {
            this.ok([GreetSerializer(new Greeting('hello')), GreetSerializer2(new Greeting2('hello'))])
          }
        }

        it('calls render on each serializer', () => {
          const controller = new MyController2(req, res, { action: 'show' })
          controller.index()
          expect(toJsonSpy).toHaveBeenCalledWith(
            [{ greeting: 'hello world' }, { greeting: 'hello goodbye' }],
            false,
          )
        })
      })
    })

    context('with default passthrough data set on the controller', () => {
      class User2 extends User {
        public override get serializers() {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            default: 'User2Serializer',
            summary: 'User2SummarySerializer',
            extra: 'User2ExtraSerializer',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      }

      const User2Serializer = (user: User, passthrough: { howyadoin: string }) =>
        UserSerializer(user, passthrough).customAttribute('howyadoin', () => passthrough.howyadoin, {
          openapi: 'string',
        })

      const User2SummarySerializer = (user: User, passthrough: { howyadoin: string }) =>
        UserSummarySerializer(user, passthrough).customAttribute('howyadoin', () => passthrough.howyadoin, {
          openapi: 'string',
        })

      const User2ExtraSerializer = (user: User, passthrough: { howyadoin: string }) =>
        UserExtraSerializer(user, passthrough).customAttribute('howyadoin', () => passthrough.howyadoin, {
          openapi: 'string',
        })

      class MyController extends PsychicController {
        public async show() {
          this.ok(await User2.first())
        }

        @BeforeAction()
        public configure() {
          this.serializerPassthrough({ howyadoin: 'howyadoin' })
        }
      }
      processDynamicallyDefinedControllers(MyController)

      let user2: User2

      beforeEach(async () => {
        user2 = await User2.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
        const dreamApp = DreamApp.getOrFail()
        vi.spyOn(dreamApp, 'serializers', 'get').mockReturnValue({
          ...dreamApp.serializers,
          User2Serializer,
          User2SummarySerializer,
          User2ExtraSerializer,
        })

        vi.spyOn(DreamApp, 'getOrFail').mockReturnValue(dreamApp)
      })

      it('passes the passthrough data through to the child serializers', async () => {
        const controller = new MyController(req, res, { action: 'show' })

        await controller.runAction()
        expect(toJsonSpy).toHaveBeenCalledWith(
          {
            id: user2.id,
            email: 'how@yadoin',
            name: 'fred',
            howyadoin: 'howyadoin',
          },
          false,
        )

        await controller.show()
      })
    })
  })
})
