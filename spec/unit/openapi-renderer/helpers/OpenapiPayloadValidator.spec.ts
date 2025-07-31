import OpenapiEndpointRenderer from '../../../../src/openapi-renderer/endpoint.js'
import OpenapiPayloadValidator from '../../../../src/openapi-renderer/helpers/OpenapiPayloadValidator.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('OpenapiPayloadValidator', () => {
  describe('#validateOpenapiHeaders', () => {
    it('validates headers', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
        security: [{ customToken: [] }],
        validate: { all: true },
        headers: {
          chalupas: {
            required: true,
            schema: {
              type: 'string',
              enum: ['delicious'],
            },
          },
        },
      })
      const validator = new OpenapiPayloadValidator('default', renderer)
      expect(() => validator.validateOpenapiHeaders({ chalupas: 'delicious' })).not.toThrow()
      expect(() => validator.validateOpenapiHeaders({ chalupas: 'not delicious' })).toThrow()
    })
  })

  describe('#validateOpenapiRequestBody', () => {
    it('validates request bodies', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'update', {
        security: [{ customToken: [] }],
        validate: { all: true },
        requestBody: {
          type: 'object',
          properties: {
            numericParam: 'number',
          },
        },
      })
      const validator = new OpenapiPayloadValidator('default', renderer)
      expect(() => validator.validateOpenapiRequestBody({ numericParam: 123 })).not.toThrow()
      expect(() => validator.validateOpenapiRequestBody({ numericParam: 'hello' })).toThrow()
    })
  })

  describe('#validateOpenapiQuery', () => {
    it('validates query params', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
        security: [{ customToken: [] }],
        validate: { all: true },
        query: {
          numericParam: {
            required: false,
            schema: 'number',
          },
        },
      })
      const validator = new OpenapiPayloadValidator('default', renderer)
      expect(() => validator.validateOpenapiQuery({ numericParam: 123 })).not.toThrow()
      expect(() => validator.validateOpenapiQuery({ numericParam: 'hello' })).toThrow()
    })
  })

  describe('#validateOpenapiResponseBody', () => {
    it('validates response bodies', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
        security: [{ customToken: [] }],
        validate: { all: true },
        responses: {
          200: {
            type: 'number',
          },
        },
      })
      const validator = new OpenapiPayloadValidator('default', renderer)
      expect(() => validator.validateOpenapiResponseBody(123, 200)).not.toThrow()
      expect(() => validator.validateOpenapiResponseBody('hello', 200)).toThrow()
    })
  })
})
