import { getMockReq, getMockRes } from '@jest-mock/express'
import { DreamSerializer, Attribute, Dream } from 'dream'
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

      jest.spyOn(res, 'json')

      await User.create({ email: 'how@yadoin', password_digest: 'hello' })
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

        await User.create({ email: 'how@yadoin', name: 'fred', password_digest: 'hello' })
        await User.create({ email: 'zed@zed', name: 'zed', password_digest: 'hello' })
        const controller = new MyController(req, res, { config })

        await controller.index()
        expect(res.json).toHaveBeenCalledWith([
          { email: 'how@yadoin', name: 'fred' },
          { email: 'zed@zed', name: 'zed' },
        ])

        await controller.show()
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
        await User2.create({ email: 'how@yadoin', name: 'fred', password_digest: 'hello' })
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
