/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenapiEndpointRenderer, {
  OpenapiEndpointRendererOpts,
  OpenapiResponses,
} from '../../../../src/openapi-renderer/endpoint.js'
import PsychicApp from '../../../../src/psychic-app/index.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import User from '../../../../test-app/src/app/models/User.js'

// `this.respond(...)` sends the success status the endpoint's OpenAPI document
// shows, so the status it sends is always one the document describes
describe('OpenapiEndpointRenderer#respondStatus', () => {
  const body = { type: 'object', properties: { id: 'string' } } as const

  type AnyRenderer = OpenapiEndpointRenderer<any, any>

  function renderer(model: typeof User | null, opts?: OpenapiEndpointRendererOpts<any, any>): AnyRenderer {
    return new OpenapiEndpointRenderer(model, UsersController, 'howyadoin', opts)
  }

  // the statuses of the responses the named OpenAPI document shows for the endpoint
  function documentedStatuses(endpointRenderer: AnyRenderer, openapiName: string = 'default') {
    const { openapi } = endpointRenderer['parseResponses']({
      openapiName,
      renderOpts: {
        casing: 'camel',
        suppressResponseEnums: false,
        legacyImplicitRequestBodyParams: false,
      },
    })
    return Object.keys(openapi).map(status => parseInt(status))
  }

  function expectRespondStatus(
    endpointRenderer: AnyRenderer,
    expectedStatus: number,
    openapiNames: string[] = ['default'],
  ) {
    expect(endpointRenderer.respondStatus(openapiNames)).toEqual(expectedStatus)

    openapiNames.forEach(openapiName => {
      expect(documentedStatuses(endpointRenderer, openapiName)).toContain(expectedStatus)

      // respondStatus reads the same success statuses parseResponses renders
      expect([...endpointRenderer['documentedSuccessStatuses'](openapiName)].sort((a, b) => a - b)).toEqual(
        documentedStatuses(endpointRenderer, openapiName)
          .filter(status => status >= 200 && status < 300)
          .sort((a, b) => a - b),
      )
    })
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

  const documentDefault = {
    description: 'from the document defaults',
    content: { 'application/json': { schema: { type: 'object' } } },
  } as OpenapiResponses[number]

  context('with no model, view model or serializer', () => {
    it('with no status, is the 204 the document gives the success response', () => {
      expectRespondStatus(renderer(null), 204)
    })

    it('with an explicit status, is that status', () => {
      expectRespondStatus(renderer(null, { status: 201 }), 201)
      expectRespondStatus(renderer(null, { status: 204 }), 204)
    })

    it('with responses declaring only a 200, is 200, though the generated default would be 204', () => {
      expectRespondStatus(renderer(null, { responses: { 200: body } }), 200)
    })

    it('with responses declaring only a 201, is 201', () => {
      expectRespondStatus(renderer(null, { responses: { 201: body } }), 201)
    })

    it('with responses declaring only a 204, is 204', () => {
      expectRespondStatus(renderer(null, { responses: { 204: { description: 'deleted' } } }), 204)
    })

    it('with responses declaring only error statuses, is the generated 204', () => {
      expectRespondStatus(renderer(null, { responses: { 400: body } }), 204)
    })
  })

  context('with a model', () => {
    it('with no status, is the 200 the document gives the success response', () => {
      expectRespondStatus(renderer(User), 200)
    })

    it('with an explicit status, is that status', () => {
      expectRespondStatus(renderer(User, { status: 201 }), 201)
      expectRespondStatus(renderer(User, { status: 204 }), 204)
    })

    it('with responses declaring only a 201, is 201', () => {
      expectRespondStatus(renderer(User, { responses: { 201: body } }), 201)
    })

    it('with responses declaring only a 204, is 204', () => {
      expectRespondStatus(renderer(User, { responses: { 204: { description: 'deleted' } } }), 204)
    })
  })

  context('with an explicit status the document does not show', () => {
    it('is the documented success status', () => {
      expectRespondStatus(renderer(User, { status: 204, responses: { 200: body } }), 200)
      expectRespondStatus(
        renderer(null, { status: 201, responses: { 204: { description: 'deleted' } } }),
        204,
      )
    })
  })

  context('when the document shows more than one success status', () => {
    it('is the explicit status when the document shows it', () => {
      expectRespondStatus(
        renderer(null, { status: 204, responses: { 201: body, 204: { description: 'deleted' } } }),
        204,
      )
    })

    it('with no status, is 200 when the document shows it', () => {
      expectRespondStatus(renderer(null, { responses: { 201: body, 200: body } }), 200)
      expectRespondStatus(renderer(User, { responses: { 202: body } }), 200)
    })

    it('otherwise, is the lowest documented success status', () => {
      expectRespondStatus(renderer(null, { responses: { 204: { description: 'deleted' }, 201: body } }), 201)
      // the generated 204 beside a hand-written 202
      expectRespondStatus(renderer(null, { responses: { 202: body } }), 202)
      expect(documentedStatuses(renderer(null, { responses: { 202: body } }))).toContain(204)
    })
  })

  context("when the OpenAPI document's defaults.responses adds a success status", () => {
    it('counts it as a documented success status, as the rendered document does', () => {
      addDocumentDefaultResponses('default', { 200: documentDefault })
      // the default 200 beside the generated 204
      expectRespondStatus(renderer(null), 200)
      expect(documentedStatuses(renderer(null))).toEqual(expect.arrayContaining([200, 204]))
    })

    it('applies the same precedence: the explicit status, else 200, else the lowest', () => {
      addDocumentDefaultResponses('default', { 201: documentDefault })
      expectRespondStatus(renderer(null), 201)
      expectRespondStatus(renderer(null, { status: 204 }), 204)
      expectRespondStatus(renderer(User), 200)
    })

    it('does not count it under omitDefaultResponses, which leaves it out of the document', () => {
      addDocumentDefaultResponses('default', { 200: documentDefault })
      expectRespondStatus(renderer(null, { omitDefaultResponses: true }), 204)
    })

    it('a response the endpoint declares for the same status replaces the default', () => {
      addDocumentDefaultResponses('default', { 201: documentDefault })
      expectRespondStatus(renderer(null, { responses: { 201: body } }), 201)
    })

    it('ignores a default that is not a success status', () => {
      expectRespondStatus(renderer(null), 204)
      expect(documentedStatuses(renderer(null))).toEqual(expect.arrayContaining([418, 490]))
    })
  })

  context('for an endpoint in more than one OpenAPI document', () => {
    it('is a success status every document shows', () => {
      addDocumentDefaultResponses('default', { 200: documentDefault })
      expectRespondStatus(renderer(null), 204, ['default', 'mobile'])
      expectRespondStatus(renderer(null), 204, ['mobile', 'default'])
      expectRespondStatus(renderer(null), 200, ['default'])
      expectRespondStatus(renderer(null), 204, ['mobile'])
    })

    it('applies the precedence to the success statuses every document shows', () => {
      addDocumentDefaultResponses('default', { 200: documentDefault, 201: documentDefault })
      addDocumentDefaultResponses('mobile', { 201: documentDefault })
      expectRespondStatus(renderer(null), 201, ['default', 'mobile'])

      addDocumentDefaultResponses('mobile', { 200: documentDefault })
      expectRespondStatus(renderer(null), 200, ['default', 'mobile'])
    })
  })

  context('for an endpoint in no OpenAPI document', () => {
    it('is a success status the decorator itself documents', () => {
      addDocumentDefaultResponses('default', { 200: documentDefault })
      expect(renderer(null).respondStatus([])).toEqual(204)
      expect(renderer(null, { responses: { 201: body } }).respondStatus([])).toEqual(201)
    })
  })
})
