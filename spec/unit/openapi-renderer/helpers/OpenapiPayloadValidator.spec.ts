import OpenapiEndpointRenderer from '../../../../src/openapi-renderer/endpoint.js'
import OpenapiPayloadValidator from '../../../../src/openapi-renderer/helpers/OpenapiPayloadValidator.js'
import { _testOnlyClearValidatorCache } from '../../../../src/openapi-renderer/helpers/validator-cache.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('OpenapiPayloadValidator', () => {
  afterEach(() => {
    _testOnlyClearValidatorCache()
  })

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

  describe('caching behavior', () => {
    it('caches validators and reuses them on subsequent calls', () => {
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

      const validator1 = new OpenapiPayloadValidator('default', renderer)
      const validator2 = new OpenapiPayloadValidator('default', renderer)

      // First call should compile and cache - valid data
      validator1.validateOpenapiRequestBody({ numericParam: 123 })

      // Second call should use cached validator - valid data
      validator2.validateOpenapiRequestBody({ numericParam: 456 })

      // Both validators work correctly with the cached validator
      expect(() => validator1.validateOpenapiRequestBody({ numericParam: 789 })).not.toThrow()
      expect(() => validator2.validateOpenapiRequestBody({ numericParam: 321 })).not.toThrow()

      // Invalid data still throws using cached validator
      expect(() => validator1.validateOpenapiRequestBody({ numericParam: 'hello' })).toThrow()
      expect(() => validator2.validateOpenapiRequestBody({ numericParam: 'world' })).toThrow()
    })

    it('uses separate cache entries for different validation targets', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'update', {
        security: [{ customToken: [] }],
        validate: { all: true },
        requestBody: {
          type: 'object',
          properties: {
            bodyParam: 'string',
          },
        },
        query: {
          queryParam: {
            required: false,
            schema: 'number',
          },
        },
      })

      const validator = new OpenapiPayloadValidator('default', renderer)

      // Different validation targets should be cached separately
      expect(() => validator.validateOpenapiRequestBody({ bodyParam: 'text' })).not.toThrow()
      expect(() => validator.validateOpenapiQuery({ queryParam: 123 })).not.toThrow()

      // Invalid data should fail for each target
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      expect(() => validator.validateOpenapiRequestBody({ bodyParam: 123 as any })).toThrow()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      expect(() => validator.validateOpenapiQuery({ queryParam: 'invalid' as any })).toThrow()
    })

    it('uses separate cache entries for different controller actions', () => {
      const renderer1 = new OpenapiEndpointRenderer(User, UsersController, 'create', {
        validate: { all: true },
        requestBody: {
          type: 'object',
          properties: {
            field: 'string',
          },
        },
      })

      const renderer2 = new OpenapiEndpointRenderer(User, UsersController, 'update', {
        validate: { all: true },
        requestBody: {
          type: 'object',
          properties: {
            field: 'number',
          },
        },
      })

      const validator1 = new OpenapiPayloadValidator('default', renderer1)
      const validator2 = new OpenapiPayloadValidator('default', renderer2)

      // Different actions should be cached separately with different schemas
      expect(() => validator1.validateOpenapiRequestBody({ field: 'text' })).not.toThrow()
      expect(() => validator2.validateOpenapiRequestBody({ field: 123 })).not.toThrow()

      // Each validator enforces its own schema
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      expect(() => validator1.validateOpenapiRequestBody({ field: 123 as any })).toThrow()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      expect(() => validator2.validateOpenapiRequestBody({ field: 'text' as any })).toThrow()
    })
  })

  describe('#getResponseSchema', () => {
    it('returns the response schema for a given status code', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
        responses: {
          200: {
            type: 'object',
            properties: {
              id: 'number',
              name: 'string',
            },
          },
        },
      })

      const validator = new OpenapiPayloadValidator('default', renderer)
      const schema = validator.getResponseSchema(200)

      expect(schema).toBeDefined()
      expect(schema).toHaveProperty('type', 'object')
      expect(schema).toHaveProperty('properties')
    })

    it('returns undefined when no schema exists for the status code', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
        responses: {
          200: {
            type: 'object',
            properties: {
              id: 'number',
            },
          },
        },
      })

      const validator = new OpenapiPayloadValidator('default', renderer)
      const schema = validator.getResponseSchema(404)

      expect(schema).toBeUndefined()
    })
  })

  describe('#getResponseSchemaWithComponents', () => {
    it('returns the response schema with components merged in', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
        responses: {
          200: {
            type: 'object',
            properties: {
              id: 'number',
              name: 'string',
            },
          },
        },
      })

      const validator = new OpenapiPayloadValidator('default', renderer)
      const schemaWithComponents = validator.getResponseSchemaWithComponents(200)

      expect(schemaWithComponents).toBeDefined()
      expect(schemaWithComponents).toHaveProperty('type', 'object')
      expect(schemaWithComponents).toHaveProperty('properties')
      expect(schemaWithComponents).toHaveProperty('components')
    })

    it('returns undefined when no schema exists for the status code', () => {
      const renderer = new OpenapiEndpointRenderer(User, UsersController, 'show', {
        responses: {
          200: {
            type: 'object',
            properties: {
              id: 'number',
            },
          },
        },
      })

      const validator = new OpenapiPayloadValidator('default', renderer)
      const schemaWithComponents = validator.getResponseSchemaWithComponents(404)

      expect(schemaWithComponents).toBeUndefined()
    })
  })
})
