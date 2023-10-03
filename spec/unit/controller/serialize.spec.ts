import { getMockReq, getMockRes } from '@jest-mock/express'
import { DreamSerializer, Attribute } from '@rvohealth/dream'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/User'
import { Request, Response } from 'express'
import { BeforeAction } from '../../../src/controller/decorators'

describe('PsychicController', () => {
  describe('#serialize', () => {
    let req: Request
    let res: Response
    let server: PsychicServer
    let config: PsychicConfig

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      res = getMockRes().res
      server = new PsychicServer()
      config = new PsychicConfig(server.app)
      jest.spyOn(res, 'json')
    })

    it('serializes the data using the provided serializer', async () => {
      class MySerializer extends DreamSerializer {
        @Attribute()
        public email: string
      }
      class MyController extends PsychicController {
        static {
          this.serializes(User).with(MySerializer)
        }

        public async show() {
          this.ok(await User.first())
        }
      }

      await User.create({ email: 'how@yadoin', passwordDigest: 'hello' })
      const controller = new MyController(req, res, { config })

      await controller.show()
      expect(res.json).toHaveBeenCalledWith({ email: 'how@yadoin' })
    })

    context('without a serializer explicitly bound to the controller', () => {
      it('identifies serializer attached to model class and uses it to serialize', async () => {
        class MyController extends PsychicController {
          public async index() {
            this.ok(await User.all())
          }

          public async show() {
            this.ok(await User.first())
          }
        }

        await User.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
        await User.create({ email: 'zed@zed', name: 'zed', passwordDigest: 'hello' })
        const controller = new MyController(req, res, { config })

        await controller.index()
        expect(res.json).toHaveBeenCalledWith([
          { email: 'how@yadoin', name: 'fred' },
          { email: 'zed@zed', name: 'zed' },
        ])

        await controller.show()
      })

      context('when the model is not a Dream', () => {
        class GreetSerializer extends DreamSerializer {
          @Attribute()
          public greeting(): string {
            return `${(this.data as Greeting).word} world`
          }
        }

        class GreetSerializer2 extends DreamSerializer {
          @Attribute()
          public greeting(): string {
            return `${(this.data as Greeting).word} goodbye`
          }
        }

        class Greeting {
          public word: string

          constructor(word: string) {
            this.word = word
          }

          public get serializer() {
            return GreetSerializer
          }
        }

        class Greeting2 {
          public word: string

          constructor(word: string) {
            this.word = word
          }

          public get serializer() {
            return GreetSerializer2
          }
        }

        class MyController extends PsychicController {
          public async index() {
            this.ok([new Greeting('hello'), new Greeting('howdy')])
          }

          public async show() {
            this.ok(new Greeting('hello'))
          }
        }

        it('identifies serializer attached to model class and uses it to serialize the object', async () => {
          const controller = new MyController(req, res, { config })
          await controller.show()
          expect(res.json).toHaveBeenCalledWith({ greeting: 'hello world' })
        })

        it('identifies serializer attached to model class and uses it to serialize each object in an array', async () => {
          const controller = new MyController(req, res, { config })
          await controller.index()
          expect(res.json).toHaveBeenCalledWith([{ greeting: 'hello world' }, { greeting: 'howdy world' }])
        })

        context('with instances of different classes', () => {
          class MyController2 extends PsychicController {
            public async index() {
              this.ok([new Greeting('hello'), new Greeting2('hello')])
            }
          }

          it('allows rendering of different types in the same array', async () => {
            const controller = new MyController2(req, res, { config })
            await controller.index()
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
        public get serializer() {
          return User2Serializer as any
        }
      }

      class User2Serializer extends DreamSerializer {
        @Attribute()
        public howyadoin() {
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

      beforeEach(async () => {
        await User2.create({ email: 'how@yadoin', name: 'fred', passwordDigest: 'hello' })
      })

      it('passes the passthrough data through to the child serializers', async () => {
        const controller = new MyController(req, res, { config })

        await controller.runAction('show')
        expect(res.json).toHaveBeenCalledWith({ howyadoin: 'howyadoin' })

        await controller.show()
      })
    })
  })
})
