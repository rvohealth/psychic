import {
  createValidator,
  ValidateOpenapiSchemaOptions,
} from '../../../../src/helpers/validateOpenApiSchema.js'
import OpenapiEndpointRenderer, { OpenapiValidateOption } from '../../../../src/openapi-renderer/endpoint.js'
import OpenapiPayloadValidator from '../../../../src/openapi-renderer/helpers/OpenapiPayloadValidator.js'
import schemaRejectsEmptyObject from '../../../../src/openapi-renderer/helpers/schemaRejectsEmptyObject.js'
import PsychicApp from '../../../../src/psychic-app/index.js'
import UsersController from '../../../../test-app/src/app/controllers/UsersController.js'
import User from '../../../../test-app/src/app/models/User.js'

// The `required` flag on a rendered request body is request validation's own
// answer for a request sent without a body (`{}`): the schema, with the
// document's components, compiled by `createValidator` under the options
// request validation uses, and run on `{}`. Every case below pins the answer
// and checks it against `createValidator` directly.
describe('schemaRejectsEmptyObject', () => {
  const componentSchemas = {
    Requiring: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
    Accepting: { type: 'object', properties: { name: { type: 'string' } } },
    PointsAtRequiring: { $ref: '#/components/schemas/Requiring' },
    LoopA: { $ref: '#/components/schemas/LoopB' },
    LoopB: { $ref: '#/components/schemas/LoopA' },
    Defaults: { type: 'object', properties: { name: { type: 'string', default: 'Fred' } } },
    DefaultsA: { type: 'object', properties: { a: { type: 'string', default: 'z' } } },
    RequiresA: { type: 'object', required: ['a'], properties: { a: { type: 'string' } } },
  }
  const components = { schemas: componentSchemas }

  function rejects(schema: unknown, ajvOptions: ValidateOpenapiSchemaOptions = {}) {
    return schemaRejectsEmptyObject(schema, components, ajvOptions)
  }

  function validatorRejects(schema: object, ajvOptions: ValidateOpenapiSchemaOptions = {}) {
    return !createValidator({ ...schema, components }, ajvOptions)({})
  }

  function expectAnswer(schema: object, expected: boolean, ajvOptions: ValidateOpenapiSchemaOptions = {}) {
    expect(validatorRejects(schema, ajvOptions)).toBe(expected)
    expect(rejects(schema, ajvOptions)).toBe(expected)
  }

  context('a top-level required list', () => {
    it('rejects {} when the list is not empty', () => {
      expectAnswer({ type: 'object', required: ['name'], properties: { name: { type: 'string' } } }, true)
    })

    it('accepts {} when the list is empty', () => {
      expectAnswer({ type: 'object', required: [], properties: { name: { type: 'string' } } }, false)
    })

    it('accepts {} when every required property has a default, which request validation fills in', () => {
      expectAnswer(
        { type: 'object', required: ['name'], properties: { name: { type: 'string', default: 'Fred' } } },
        false,
      )
    })

    it('rejects {} when any required property has no default', () => {
      expectAnswer(
        {
          type: 'object',
          required: ['name', 'species'],
          properties: { name: { type: 'string', default: 'Fred' }, species: { type: 'string' } },
        },
        true,
      )
    })
  })

  context('no required list', () => {
    it('accepts {}', () => {
      expectAnswer({ type: 'object', properties: { name: { type: 'string' } } }, false)
    })

    it('accepts {} for a nullable object', () => {
      expectAnswer({ type: ['object', 'null'], properties: { name: { type: 'string' } } }, false)
    })

    it('accepts {} when only a nested object has a required list', () => {
      expectAnswer(
        {
          type: 'object',
          properties: {
            nested: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
          },
        },
        false,
      )
    })
  })

  context('a type that is not an object', () => {
    it('rejects {} for an array body', () => {
      expectAnswer({ type: 'array', items: { type: 'string' } }, true)
    })

    it('rejects {} for a nullable array body', () => {
      expectAnswer({ type: ['array', 'null'], items: { type: 'string' } }, true)
    })
  })

  context('minProperties', () => {
    it('rejects {} when minProperties is 1 or more', () => {
      expectAnswer({ type: 'object', minProperties: 1, properties: { name: { type: 'string' } } }, true)
    })

    it('accepts {} when minProperties is 0', () => {
      expectAnswer({ type: 'object', minProperties: 0, properties: { name: { type: 'string' } } }, false)
    })
  })

  context('$ref', () => {
    it('rejects {} when the referenced component rejects it', () => {
      expectAnswer({ $ref: '#/components/schemas/Requiring' }, true)
    })

    it('rejects {} through a chain of references', () => {
      expectAnswer({ $ref: '#/components/schemas/PointsAtRequiring' }, true)
    })

    it('accepts {} when the referenced component accepts it', () => {
      expectAnswer({ $ref: '#/components/schemas/Accepting' }, false)
    })

    it('accepts {} when the reference does not resolve, which the validator cannot compile', () => {
      expect(() => validatorRejects({ $ref: '#/components/schemas/Missing' })).toThrow()
      expect(rejects({ $ref: '#/components/schemas/Missing' })).toBe(false)
    })

    it('accepts {} for a reference cycle, which the validator cannot compile', () => {
      expect(() => validatorRejects({ $ref: '#/components/schemas/LoopA' })).toThrow()
      expect(rejects({ $ref: '#/components/schemas/LoopA' })).toBe(false)
    })

    it('accepts {} when a required property gets its default from the referenced component', () => {
      expectAnswer({ type: 'object', required: ['a'], $ref: '#/components/schemas/DefaultsA' }, false)
    })

    it('rejects {} when the referenced component requires a property only the referencing schema defaults', () => {
      expectAnswer(
        {
          type: 'object',
          $ref: '#/components/schemas/RequiresA',
          properties: { a: { type: 'string', default: 'z' } },
        },
        true,
      )
    })
  })

  context('allOf', () => {
    it('rejects {} when any member rejects it', () => {
      expectAnswer(
        { allOf: [{ $ref: '#/components/schemas/Accepting' }, { $ref: '#/components/schemas/Requiring' }] },
        true,
      )
    })

    it('accepts {} when every member accepts it', () => {
      expectAnswer(
        { allOf: [{ $ref: '#/components/schemas/Accepting' }, { type: 'object', properties: {} }] },
        false,
      )
    })

    it('accepts {} when a referenced member fills in the default a later member requires', () => {
      expectAnswer(
        {
          allOf: [
            { $ref: '#/components/schemas/Defaults' },
            { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
          ],
        },
        false,
      )
    })

    it('accepts {} when a referenced member fills in a default the parent requires', () => {
      expectAnswer(
        { type: 'object', required: ['a'], allOf: [{ $ref: '#/components/schemas/DefaultsA' }] },
        false,
      )
    })

    it('accepts {} when a referenced member fills in a default that meets the parent minProperties', () => {
      expectAnswer(
        { type: 'object', minProperties: 1, allOf: [{ $ref: '#/components/schemas/DefaultsA' }] },
        false,
      )
    })

    it('rejects {} when a member requires a property only the parent defaults', () => {
      expectAnswer(
        {
          type: 'object',
          properties: { a: { type: 'string', default: 'z' } },
          allOf: [{ type: 'object', required: ['a'] }],
        },
        true,
      )
    })

    it('rejects {} when a member requires a property only a later member defaults', () => {
      expectAnswer(
        {
          type: 'object',
          allOf: [
            { type: 'object', required: ['a'] },
            { type: 'object', properties: { a: { type: 'string', default: 'z' } } },
          ],
        },
        true,
      )
    })
  })

  context('oneOf and anyOf', () => {
    for (const combinator of ['oneOf', 'anyOf'] as const) {
      context(combinator, () => {
        it('rejects {} when every branch rejects it', () => {
          expectAnswer(
            {
              [combinator]: [
                { $ref: '#/components/schemas/Requiring' },
                { type: 'object', required: ['email'], properties: { email: { type: 'string' } } },
              ],
            },
            true,
          )
        })

        it('accepts {} when one branch accepts it', () => {
          expectAnswer(
            {
              [combinator]: [
                { $ref: '#/components/schemas/Requiring' },
                { $ref: '#/components/schemas/Accepting' },
              ],
            },
            false,
          )
        })
      })
    }

    it('oneOf rejects {} when more than one branch accepts it', () => {
      expectAnswer(
        {
          oneOf: [
            { type: 'object', properties: { a: { type: 'string' } } },
            { type: 'object', properties: { b: { type: 'string' } } },
          ],
        },
        true,
      )
    })

    it('anyOf rejects {} when its branch requires a property only that branch defaults', () => {
      expectAnswer(
        { anyOf: [{ type: 'object', required: ['a'], properties: { a: { type: 'string', default: 'x' } } }] },
        true,
      )
    })

    it('oneOf rejects {} when its object branch requires a property only that branch defaults', () => {
      expectAnswer(
        {
          oneOf: [
            { type: 'object', required: ['a'], properties: { a: { type: 'string', default: 'z' } } },
            { type: 'string' },
          ],
        },
        true,
      )
    })
  })

  context('a schema the validator cannot compile under its options', () => {
    // `required` without `type: 'object'` fails strictTypes, which request
    // validation turns on
    const schema = { required: ['a'], properties: { a: { type: 'string' } } }

    it('accepts {} without throwing', () => {
      expect(() => validatorRejects(schema)).toThrow()
      expect(() => rejects(schema)).not.toThrow()
      expect(rejects(schema)).toBe(false)
    })

    it('answers as the validator does when the options let it compile', () => {
      expectAnswer(schema, true, { strictTypes: false })
    })
  })

  context('the validator options', () => {
    it('answers under the options given, such as useDefaults: false', () => {
      expectAnswer(
        { type: 'object', required: ['name'], properties: { name: { type: 'string', default: 'Fred' } } },
        true,
        { useDefaults: false },
      )
    })
  })

  context('no schema', () => {
    it('accepts {}', () => {
      expect(rejects(undefined)).toBe(false)
    })
  })
})

describe('OpenapiPayloadValidator#requestBodyRejectsEmptyObject', () => {
  // A required property with a default: the validator fills it in, unless its
  // options turn useDefaults off
  const schema = {
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string', default: 'Fred' } },
  }
  const components = { schemas: {} }

  function payloadValidator(validate?: OpenapiValidateOption) {
    const renderer = new OpenapiEndpointRenderer(User, UsersController, 'update', {
      requestBody: { type: 'object', properties: { name: 'string' } },
      ...(validate ? { validate } : {}),
    })
    return new OpenapiPayloadValidator('default', renderer)
  }

  it('answers under the default request validation options', () => {
    expect(payloadValidator().requestBodyRejectsEmptyObject(schema, components)).toBe(false)
  })

  it('answers under the endpoint’s validate.ajvOptions', () => {
    expect(
      payloadValidator({ ajvOptions: { useDefaults: false } }).requestBodyRejectsEmptyObject(
        schema,
        components,
      ),
    ).toBe(true)
  })

  context('with validate.ajvOptions in the app’s openapi config', () => {
    let originalValidate: unknown

    beforeEach(() => {
      const openapiConfig = PsychicApp.getOrFail().openapi.default!
      originalValidate = openapiConfig.validate
      openapiConfig.validate = { ...openapiConfig.validate, ajvOptions: { useDefaults: false } }
    })

    afterEach(() => {
      PsychicApp.getOrFail().openapi.default!.validate = originalValidate as never
    })

    it('answers under those options', () => {
      expect(payloadValidator().requestBodyRejectsEmptyObject(schema, components)).toBe(true)
    })

    it('lets the endpoint’s validate.ajvOptions override them, as request validation does', () => {
      expect(
        payloadValidator({ ajvOptions: { useDefaults: true } }).requestBodyRejectsEmptyObject(
          schema,
          components,
        ),
      ).toBe(false)
    })
  })
})
