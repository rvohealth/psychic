import Koa from 'koa'
import { MockInstance } from 'vitest'
import { OpenAPI } from '../../../src/controller/decorators.js'
import PsychicController from '../../../src/controller/index.js'
import * as toJsonModule from '../../../src/helpers/toJson.js'
import { OpenapiResponses } from '../../../src/openapi-renderer/endpoint.js'
import PsychicApp from '../../../src/psychic-app/index.js'
import User from '../../../test-app/src/app/models/User.js'
import processDynamicallyDefinedControllers from '../../helpers/processDynamicallyDefinedControllers.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

describe('PsychicController', () => {
  describe('#respond', () => {
    let ctx: Koa.Context
    let toJsonSpy: MockInstance

    const createdBody = { type: 'object', properties: { id: 'string' } } as const

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

      // options keep the decorator from inferring a serializer before the app is initialized
      @OpenAPI(User, {})
      public modelBacked() {
        this.respond({ id: '1' })
      }

      @OpenAPI()
      public modellessNoData() {
        this.respond()
      }

      @OpenAPI()
      public modellessUndefined() {
        this.respond(undefined)
      }

      @OpenAPI()
      public modellessWithData() {
        this.respond({ any: 'data' })
      }

      @OpenAPI()
      public modellessWithNull() {
        this.respond(null)
      }

      @OpenAPI({ responses: { 200: createdBody } })
      public modelless200Responses() {
        this.respond({ id: '1' })
      }

      @OpenAPI({ responses: { 201: createdBody } })
      public modelless201Responses() {
        this.respond({ id: '1' })
      }

      @OpenAPI(User, { responses: { 201: createdBody } })
      public model201Responses() {
        this.respond({ id: '1' })
      }

      @OpenAPI(User, { responses: { 204: { description: 'deleted' } } })
      public model204ResponsesNoData() {
        this.respond()
      }

      @OpenAPI(User, { responses: { 204: { description: 'deleted' } } })
      public model204ResponsesWithData() {
        this.respond({ id: '1' })
      }

      @OpenAPI({ status: 204 })
      public explicit204NoData() {
        this.respond()
      }

      @OpenAPI({ status: 204 })
      public explicit204WithData() {
        this.respond({ any: 'data' })
      }

      @OpenAPI(User, { status: 204, responses: { 200: createdBody } })
      public explicit204Documented200() {
        this.respond({ id: '1' })
      }

      @OpenAPI({ omitDefaultResponses: true })
      public modellessOmitDefaultsNoData() {
        this.respond()
      }

      @OpenAPI({ omitDefaultResponses: true })
      public modellessOmitDefaultsWithData() {
        this.respond({ any: 'data' })
      }
    }

    // renders into two OpenAPI documents, each with its own defaults
    class MyTwoDocumentController extends PsychicController {
      public static override get openapiNames() {
        return ['default', 'mobile']
      }

      @OpenAPI()
      public modellessNoData() {
        this.respond()
      }

      @OpenAPI()
      public modellessWithData() {
        this.respond({ any: 'data' })
      }
    }
    processDynamicallyDefinedControllers(MyController, MyTwoDocumentController)

    beforeEach(() => {
      ctx = createMockKoaContext({ body: { search: 'abc' }, query: { cool: 'boyjohnson' } })
      toJsonSpy = vi.spyOn(toJsonModule, 'default')
      vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)
    })

    type MyControllerAction = Exclude<keyof MyController, keyof PsychicController>

    function respondWith(action: MyControllerAction) {
      const controller = new MyController(ctx, { action })
      controller[action]()
    }

    function expectJson(status: number, data: unknown) {
      expect(ctx.status).toEqual(status)
      expect(toJsonSpy).toHaveBeenCalledWith(data)
    }

    function expectNoContent() {
      expect(ctx.status).toEqual(204)
      expect(ctx.body).toEqual('')
      expect(toJsonSpy).not.toHaveBeenCalled()
    }

    function expectNoContentThrow(action: MyControllerAction) {
      expect(() => respondWith(action)).toThrow(/204 No Content, which cannot carry a body/)
      expect(() => respondWith(action)).toThrow(new RegExp(`controller: MyController\\s+action: ${action}`))
      expect(toJsonSpy).not.toHaveBeenCalled()
    }

    type MyTwoDocumentControllerAction = Exclude<keyof MyTwoDocumentController, keyof PsychicController>

    function respondInTwoDocumentsWith(action: MyTwoDocumentControllerAction) {
      const controller = new MyTwoDocumentController(ctx, { action })
      controller[action]()
    }

    // adds responses to the `defaults.responses` of a configured OpenAPI document,
    // which adds them to every endpoint in that document
    function addDocumentDefaultResponses(openapiName: string, responses: OpenapiResponses) {
      const psychicApp = PsychicApp.getOrFail()
      const settings = psychicApp.openapi[openapiName]!
      psychicApp.set('openapi', openapiName, {
        ...settings,
        defaults: {
          ...settings.defaults,
          responses: { ...settings.defaults?.responses, ...responses },
        },
      })
    }

    function documentDefault(description: string) {
      return {
        description,
        content: { 'application/json': { schema: { type: 'object' } } },
      } as OpenapiResponses[number]
    }

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

    context('with a model and no status, which the document gives a 200', () => {
      it('sends 200', () => {
        respondWith('modelBacked')
        expectJson(200, { id: '1' })
      })
    })

    context('with no model, view model or serializer and no status, which the document gives a 204', () => {
      it('sends 204 with no body', () => {
        respondWith('modellessNoData')
        expectNoContent()
      })

      it('sends 204 with no body when passed undefined', () => {
        respondWith('modellessUndefined')
        expectNoContent()
      })

      it('throws when passed data, instead of dropping it', () => {
        expectNoContentThrow('modellessWithData')
      })

      it('throws when passed null, which it would otherwise send as a JSON null', () => {
        expectNoContentThrow('modellessWithNull')
      })
    })

    context('with responses declaring the only success status', () => {
      it('sends a declared 200, though the generated default would be 204', () => {
        respondWith('modelless200Responses')
        expectJson(200, { id: '1' })
      })

      it('sends a declared 201 with no model', () => {
        respondWith('modelless201Responses')
        expectJson(201, { id: '1' })
      })

      it('sends a declared 201 with a model', () => {
        respondWith('model201Responses')
        expectJson(201, { id: '1' })
      })

      it('sends a declared 204 with no body', () => {
        respondWith('model204ResponsesNoData')
        expectNoContent()
      })

      it('throws when passed data on a declared 204', () => {
        expectNoContentThrow('model204ResponsesWithData')
      })
    })

    context('with an explicit status: 204', () => {
      it('sends 204 with no body', () => {
        respondWith('explicit204NoData')
        expectNoContent()
      })

      it('throws when passed data, instead of dropping it', () => {
        expectNoContentThrow('explicit204WithData')
      })

      it('sends the documented status when responses declares a different success', () => {
        respondWith('explicit204Documented200')
        expectJson(200, { id: '1' })
      })
    })

    context("when the OpenAPI document's defaults.responses adds a 200 to every endpoint", () => {
      beforeEach(() => {
        addDocumentDefaultResponses('default', { 200: documentDefault('ok') })
      })

      it('sends that documented 200 with the data on an @OpenAPI() with no model, instead of throwing', () => {
        respondWith('modellessWithData')
        expectJson(200, { any: 'data' })
      })

      it('sends that documented 200 when given no data, preferring it over the generated 204', () => {
        respondWith('modellessNoData')
        expectJson(200, {})
      })

      it('sends 204 under omitDefaultResponses, which leaves the 200 out of the document', () => {
        respondWith('modellessOmitDefaultsNoData')
        expectNoContent()
        expectNoContentThrow('modellessOmitDefaultsWithData')
      })
    })

    context("when the OpenAPI document's defaults.responses adds a 201 to every endpoint", () => {
      beforeEach(() => {
        addDocumentDefaultResponses('default', { 201: documentDefault('created') })
      })

      it('sends the lowest documented success status, the 201, on an @OpenAPI() with no model', () => {
        respondWith('modellessWithData')
        expectJson(201, { any: 'data' })
      })

      it('sends the 200 a model documents, which it prefers', () => {
        respondWith('modelBacked')
        expectJson(200, { id: '1' })
      })
    })

    context('on a controller that renders into more than one OpenAPI document', () => {
      context('when only one of them adds a 200 to every endpoint', () => {
        beforeEach(() => {
          addDocumentDefaultResponses('default', { 200: documentDefault('ok') })
        })

        it('sends the 204 every document shows, since the other document does not show the 200', () => {
          respondInTwoDocumentsWith('modellessNoData')
          expectNoContent()
        })

        it('throws when passed data, naming the documents', () => {
          expect(() => respondInTwoDocumentsWith('modellessWithData')).toThrow(
            /every OpenAPI document this endpoint is in \(default, mobile\) shows[\s\S]*204 No Content, which cannot carry a body/,
          )
          expect(toJsonSpy).not.toHaveBeenCalled()
        })
      })

      context('when every one of them adds a 200 to every endpoint', () => {
        beforeEach(() => {
          addDocumentDefaultResponses('default', { 200: documentDefault('ok') })
          addDocumentDefaultResponses('mobile', { 200: documentDefault('ok') })
        })

        it('sends that 200 with the data', () => {
          respondInTwoDocumentsWith('modellessWithData')
          expectJson(200, { any: 'data' })
        })
      })
    })
  })
})
