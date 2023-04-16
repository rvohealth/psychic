import { getMockReq, getMockRes } from '@jest-mock/express'
import PsychicController from '../../../src/controller'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import User from '../../../test-app/app/models/user'
import PsychicSerializer from '../../../src/serializer'

describe('PsychicController', () => {
  describe('#serialize', () => {
    it('serializes the data using the provided serializer', async () => {
      const req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      const res = getMockRes().res
      const server = new PsychicServer()
      const config = new PsychicConfig(server.app)
      class MySerializer extends PsychicSerializer {
        static {
          this.attributes('email')
        }
      }
      class MyController extends PsychicController {
        static {
          this.serializes(User).with(MySerializer)
        }

        public async index() {
          this.ok(await User.all())
        }

        public async show() {
          this.ok(await User.first())
        }
      }

      jest.spyOn(res, 'json')

      await User.create({ email: 'how@yadoin', password_digest: 'hello' })
      const controller = new MyController(req, res, { config })
      await controller.index()

      expect(res.json).toHaveBeenCalledWith([{ email: 'how@yadoin' }])

      await controller.show()
      expect(res.json).toHaveBeenCalledWith({ email: 'how@yadoin' })
    })
  })
})
