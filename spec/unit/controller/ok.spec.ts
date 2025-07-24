import { getMockReq, getMockRes } from '@jest-mock/express'
import { Request, Response } from 'express'
import PsychicController from '../../../src/controller/index.js'
import PsychicApp from '../../../src/psychic-app/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'
import User from '../../../test-app/src/app/models/User.js'
import Post from '../../../test-app/src/app/models/Post.js'

describe('PsychicController', () => {
  describe('#ok', () => {
    let req: Request
    let res: Response
    let config: PsychicApp

    class MyController extends PsychicController {
      public howyadoin() {
        this.ok({ chalupas: 'dujour' })
      }
    }

    beforeEach(() => {
      req = getMockReq({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } }) as unknown as Request
      res = getMockRes().res as unknown as Response
      config = new PsychicApp()
      vi.spyOn(res, 'json')
    })

    it('renders the data as json', () => {
      const controller = new MyController(req, res, { config, action: 'howyadoin' })
      controller.howyadoin()
      expect(res.json).toHaveBeenCalledWith({ chalupas: 'dujour' })
    })

    context('when passed null', () => {
      class MyController extends PsychicController {
        public howyadoin() {
          this.ok(null)
        }
      }

      it('passes "null" to json without raising exception', () => {
        const controller = new MyController(req, res, { config, action: 'howyadoin' })
        controller.howyadoin()
        expect(res.json).toHaveBeenCalledWith(null)
      })
    })

    context('when passed a model with no serializerKey', () => {
      context('openapi decorator specifies a serializer', () => {
        it('uses the openapi serializer', async () => {
          const user = await User.create({ email: 'hello@world', password: 'howyadoin' })
          const post = await Post.create({ user })
          req.params.id = user.id.toString()

          const controller = new UsersController(req, res, { config, action: 'showWithPosts' })
          await controller.showWithPosts()
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              posts: expect.arrayContaining([
                expect.objectContaining({
                  id: post.id,
                }),
              ]),
            }),
          )
        })
      })
    })
  })
})
