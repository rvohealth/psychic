import Koa from 'koa'
import { MockInstance } from 'vitest'
import { OpenAPI } from '../../../src/controller/decorators.js'
import PsychicController from '../../../src/controller/index.js'
import * as toJsonModule from '../../../src/helpers/toJson.js'
import PsychicApp from '../../../src/psychic-app/index.js'
import User from '../../../test-app/src/app/models/User.js'
import processDynamicallyDefinedControllers from '../../helpers/processDynamicallyDefinedControllers.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('PsychicController', () => {
  describe('#respond', () => {
    let ctx: Koa.Context
    let toJsonSpy: MockInstance

    class MyController extends PsychicController {
      @OpenAPI(User, {
        fastJsonStringify: true,
        status: 201,
      })
      public create() {
        this.respond('created')
      }

      public update() {
        this.respond('updated')
      }
    }
    processDynamicallyDefinedControllers(MyController)

    beforeEach(() => {
      ctx = createMockKoaContext({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      toJsonSpy = vi.spyOn(toJsonModule, 'default')
      vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)
    })

    it('sets status and sends json', () => {
      const controller = new MyController(ctx, { action: 'create' })
      controller.create()
      expect(toJsonSpy).toHaveBeenCalledWith('created')
      expect(ctx.status).toEqual(201)
    })

    context('with no openapi decorator', () => {
      it('calls 200 status', () => {
        const controller = new MyController(ctx, { action: 'update' })
        controller.update()
        expect(toJsonSpy).toHaveBeenCalledWith('updated')
        expect(ctx.status).toEqual(200)
      })
    })
  })
})
