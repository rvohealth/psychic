import Koa from 'koa'
import { MockInstance } from 'vitest'
import PsychicController from '../../../src/controller/index.js'
import * as toJsonModule from '../../../src/helpers/toJson.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'
import Post from '../../../test-app/src/app/models/Post.js'
import User from '../../../test-app/src/app/models/User.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('PsychicController', () => {
  describe('#ok', () => {
    let ctx: Koa.Context
    let toJsonSpy: MockInstance

    class MyController extends PsychicController {
      public howyadoin() {
        this.ok({ chalupas: 'dujour' })
      }
    }

    beforeEach(() => {
      ctx = createMockKoaContext({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      toJsonSpy = vi.spyOn(toJsonModule, 'default')
    })

    it('renders the data as json', () => {
      const controller = new MyController(ctx, { action: 'howyadoin' })
      controller.howyadoin()
      expect(toJsonSpy).toHaveBeenCalledWith({ chalupas: 'dujour' })
    })

    context('when passed null', () => {
      class MyController extends PsychicController {
        public howyadoin() {
          this.ok(null)
        }
      }

      it('passes "null" to json without raising exception', () => {
        const controller = new MyController(ctx, { action: 'howyadoin' })
        controller.howyadoin()
        expect(toJsonSpy).toHaveBeenCalledWith(null)
      })
    })

    context('when passed a model with no serializerKey', () => {
      context('openapi decorator specifies a serializer', () => {
        it('uses the openapi serializer', async () => {
          const user = await User.create({ email: 'hello@world', password: 'howyadoin' })
          const post = await Post.create({ user })
          ctx = createMockKoaContext({ params: { id: user.id.toString() } })

          const controller = new UsersController(ctx, { action: 'showWithPosts' })
          await controller.showWithPosts()
          expect(toJsonSpy).toHaveBeenCalledWith(
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
