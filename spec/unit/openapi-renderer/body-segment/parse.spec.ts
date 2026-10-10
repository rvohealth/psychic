import { validateObject } from '../../../../src/helpers/validateOpenApiSchema.js'
import OpenapiSegmentExpander, {
  OpenapiBodySegment,
  OpenapiBodyTarget,
} from '../../../../src/openapi-renderer/body-segment.js'
import { OpenapiRenderOpts } from '../../../../src/openapi-renderer/endpoint.js'
import Balloon from '../../../../test-app/src/app/models/Balloon.js'
import User from '../../../../test-app/src/app/models/User.js'
import LatexSerializer from '../../../../test-app/src/app/serializers/Balloon/LatexSerializer.js'
import MylarSerializer from '../../../../test-app/src/app/serializers/Balloon/MylarSerializer.js'
import { BalloonSummarySerializer } from '../../../../test-app/src/app/serializers/BalloonSerializer.js'
import { UserSummarySerializer } from '../../../../test-app/src/app/serializers/UserSerializer.js'

describe('OpenapiBodySegmentRenderer', () => {
  const defaultBodySegmentRendererOpts: {
    openapiName: string
    renderOpts: OpenapiRenderOpts
    target: OpenapiBodyTarget
  } = {
    openapiName: 'default',
    renderOpts: {
      casing: 'camel',
      suppressResponseEnums: false,
      legacyImplicitRequestBodyParams: false,
    },
    target: 'response',
  }

  describe('#parse', () => {
    const subject = (bodySegment: OpenapiBodySegment) =>
      new OpenapiSegmentExpander(bodySegment, defaultBodySegmentRendererOpts).render()

    const subjectOpenapi = (bodySegment: OpenapiBodySegment) => subject(bodySegment).openapi

    it('can handle primitive types', () => {
      expect(subjectOpenapi('string')).toEqual({ type: 'string' })
      expect(subjectOpenapi('boolean')).toEqual({ type: 'boolean' })
      expect(subjectOpenapi('number')).toEqual({ type: 'number' })
      expect(subjectOpenapi('integer')).toEqual({ type: 'integer' })
    })

    it('can handle computed types', () => {
      expect(subjectOpenapi('date')).toEqual({ type: 'string', format: 'date' })
      expect(subjectOpenapi('date-time')).toEqual({ type: 'string', format: 'date-time' })
      expect(subjectOpenapi('decimal')).toEqual({ type: 'number', format: 'decimal' })
    })

    context('objects', () => {
      it('preserves description', () => {
        expect(subjectOpenapi({ type: 'string', description: 'hi' })).toEqual({
          type: 'string',
          description: 'hi',
        })
      })

      it('can handle object primitives', () => {
        expect(subjectOpenapi({ type: 'string' })).toEqual({ type: 'string' })
        expect(subjectOpenapi({ type: 'boolean' })).toEqual({ type: 'boolean' })
        expect(subjectOpenapi({ type: 'number' })).toEqual({ type: 'number' })
        expect(subjectOpenapi({ type: 'integer' })).toEqual({ type: 'integer' })
        expect(subjectOpenapi({ type: 'decimal' })).toEqual({ type: 'number', format: 'decimal' })
        expect(subjectOpenapi({ type: 'date' })).toEqual({ type: 'string', format: 'date' })
        expect(subjectOpenapi({ type: 'date-time' })).toEqual({ type: 'string', format: 'date-time' })
      })

      it('can handle objects with primitive arrays for types', () => {
        expect(subjectOpenapi({ type: 'string[]' })).toEqual({ type: 'array', items: { type: 'string' } })
        expect(subjectOpenapi({ type: 'boolean[]' })).toEqual({ type: 'array', items: { type: 'boolean' } })
        expect(subjectOpenapi({ type: 'number[]' })).toEqual({ type: 'array', items: { type: 'number' } })
        expect(subjectOpenapi({ type: 'integer[]' })).toEqual({ type: 'array', items: { type: 'integer' } })

        expect(subjectOpenapi({ type: 'decimal[]' })).toEqual({
          type: 'array',
          items: { type: 'number', format: 'decimal' },
        })
        expect(subjectOpenapi({ type: 'date[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date' },
        })
        expect(subjectOpenapi({ type: 'date-time[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date-time' },
        })
      })
    })

    context('arrays', () => {
      it('preserves description', () => {
        expect(subjectOpenapi({ type: 'string[]', description: 'hi' })).toEqual({
          type: 'array',
          description: 'hi',
          items: { type: 'string' },
        })

        expect(
          subjectOpenapi({ type: 'array', description: 'hi', items: { type: 'string', description: 'hi2' } }),
        ).toEqual({
          type: 'array',
          description: 'hi',
          items: { type: 'string', description: 'hi2' },
        })
      })

      it('can handle primitive array types', () => {
        expect(subjectOpenapi('string[]')).toEqual({ type: 'array', items: { type: 'string' } })
        expect(subjectOpenapi('boolean[]')).toEqual({ type: 'array', items: { type: 'boolean' } })
        expect(subjectOpenapi('number[]')).toEqual({ type: 'array', items: { type: 'number' } })
        expect(subjectOpenapi('integer[]')).toEqual({ type: 'array', items: { type: 'integer' } })
        expect(subjectOpenapi('decimal[]')).toEqual({
          type: 'array',
          items: { type: 'number', format: 'decimal' },
        })
        expect(subjectOpenapi('date[]')).toEqual({ type: 'array', items: { type: 'string', format: 'date' } })
        expect(subjectOpenapi('date-time[]')).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date-time' },
        })
      })

      it('can handle object primitive arrays', () => {
        expect(subjectOpenapi({ type: 'string[]' })).toEqual({ type: 'array', items: { type: 'string' } })
        expect(subjectOpenapi({ type: 'boolean[]' })).toEqual({ type: 'array', items: { type: 'boolean' } })
        expect(subjectOpenapi({ type: 'number[]' })).toEqual({ type: 'array', items: { type: 'number' } })
        expect(subjectOpenapi({ type: 'integer[]' })).toEqual({ type: 'array', items: { type: 'integer' } })

        expect(subjectOpenapi({ type: 'decimal[]' })).toEqual({
          type: 'array',
          items: { type: 'number', format: 'decimal' },
        })
        expect(subjectOpenapi({ type: 'date[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date' },
        })
        expect(subjectOpenapi({ type: 'date-time[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date-time' },
        })
      })
    })

    context('$serializable with $serializableSerializerKey', () => {
      it('uses the serializer corresponding to the serializer key', () => {
        const results = subject({
          type: 'object',
          properties: {
            results: {
              $serializable: User,
              $serializableSerializerKey: 'summary',
            },
          },
        } as OpenapiBodySegment)

        expect(results.openapi).toEqual({
          type: 'object',
          properties: {
            results: {
              $ref: '#/components/schemas/UserSummary',
            },
          },
        })
        expect(results.referencedSerializers).toEqual([UserSummarySerializer])
      })

      it('expands an STI base model into refs for each child serializer', () => {
        const results = subject({
          type: 'object',
          properties: {
            result: {
              $serializable: Balloon,
            },
          },
        } as OpenapiBodySegment)

        expect(results.openapi).toEqual({
          type: 'object',
          properties: {
            result: {
              anyOf: [
                {
                  $ref: '#/components/schemas/BalloonLatex',
                },
                {
                  $ref: '#/components/schemas/BalloonMylar',
                },
              ],
            },
          },
        })
        expect(results.referencedSerializers).toEqual([LatexSerializer, MylarSerializer])
      })

      it('expands a many STI base model into refs for each child serializer in the array items', () => {
        const results = subject({
          type: 'object',
          properties: {
            results: {
              $serializable: Balloon,
              many: true,
            },
          },
        } as OpenapiBodySegment)

        expect(results.openapi).toEqual({
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                anyOf: [
                  {
                    $ref: '#/components/schemas/BalloonLatex',
                  },
                  {
                    $ref: '#/components/schemas/BalloonMylar',
                  },
                ],
              },
            },
          },
        })
        expect(results.referencedSerializers).toEqual([LatexSerializer, MylarSerializer])
      })

      it('includes null in the STI union when maybeNull is true', () => {
        const results = subject({
          type: 'object',
          properties: {
            result: {
              $serializable: Balloon,
              maybeNull: true,
            },
          },
        } as OpenapiBodySegment)

        expect(results.openapi).toEqual({
          type: 'object',
          properties: {
            result: {
              anyOf: [
                {
                  $ref: '#/components/schemas/BalloonLatex',
                },
                {
                  $ref: '#/components/schemas/BalloonMylar',
                },
                {
                  type: 'null',
                },
              ],
            },
          },
        })
        expect(results.referencedSerializers).toEqual([LatexSerializer, MylarSerializer])
      })

      it('keeps the single ref shape when all STI children resolve to the same serializer', () => {
        const results = subject({
          type: 'object',
          properties: {
            result: {
              $serializable: Balloon,
              $serializableSerializerKey: 'sameForAllSti',
            },
          },
        } as OpenapiBodySegment)

        expect(results.openapi).toEqual({
          type: 'object',
          properties: {
            result: {
              $ref: '#/components/schemas/BalloonSummary',
            },
          },
        })
        expect(results.referencedSerializers).toEqual([BalloonSummarySerializer])
      })
    })

    context('a single serializer with maybeNull', () => {
      const userSummaryComponents = {
        components: {
          schemas: {
            UserSummary: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
          },
        },
      }

      it('is anyOf the ref or null, which validates a null', () => {
        const results = subject({
          type: 'object',
          properties: {
            fromSerializer: { $serializer: UserSummarySerializer, maybeNull: true },
            fromSerializable: { $serializable: User, $serializableSerializerKey: 'summary', maybeNull: true },
          },
        } as OpenapiBodySegment)

        const nullableUserSummary = {
          anyOf: [{ $ref: '#/components/schemas/UserSummary' }, { type: 'null' }],
        }
        expect(results.openapi).toEqual({
          type: 'object',
          properties: { fromSerializer: nullableUserSummary, fromSerializable: nullableUserSummary },
        })

        const schema = { ...results.openapi, ...userSummaryComponents }
        expect(
          validateObject({ fromSerializer: null, fromSerializable: null }, schema).errors,
        ).toBeUndefined()
        expect(
          validateObject({ fromSerializer: { id: 1 }, fromSerializable: { id: 2 } }, schema).isValid,
        ).toBe(true)
      })
    })

    // `description` and `summary` are the fields Dream's OpenAPI types allow
    // beside `allOf`, `anyOf` and `oneOf`; every other key beside a combinator
    // is dropped, so a combinator never gains a `type` or a property lock
    context('keys beside a combinator', () => {
      const keysDropped = {
        type: ['object', 'null'],
        required: ['name'],
        additionalProperties: false,
        unevaluatedProperties: false,
      }

      it('keeps description and summary beside allOf, and drops every other key', () => {
        expect(
          subjectOpenapi({
            description: 'a named, aged thing',
            summary: 'named and aged',
            ...keysDropped,
            allOf: [
              { type: 'object', properties: { name: 'string' } },
              { type: 'object', properties: { age: 'integer' } },
            ],
          } as OpenapiBodySegment),
        ).toEqual({
          allOf: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { age: { type: 'integer' } } },
          ],
          description: 'a named, aged thing',
          summary: 'named and aged',
        })
      })

      it('keeps description and summary beside anyOf, and drops every other key', () => {
        expect(
          subjectOpenapi({
            description: 'a name or a count',
            summary: 'name or count',
            ...keysDropped,
            anyOf: [{ type: 'string' }, { type: 'integer' }],
          } as OpenapiBodySegment),
        ).toEqual({
          anyOf: [{ type: 'string' }, { type: 'integer' }],
          description: 'a name or a count',
          summary: 'name or count',
        })
      })

      it('keeps description and summary beside oneOf, and drops every other key', () => {
        expect(
          subjectOpenapi({
            description: 'a name or a count',
            summary: 'name or count',
            ...keysDropped,
            oneOf: [{ type: 'string' }, { type: 'integer' }],
          } as OpenapiBodySegment),
        ).toEqual({
          oneOf: [{ type: 'string' }, { type: 'integer' }],
          description: 'a name or a count',
          summary: 'name or count',
        })
      })

      it('makes a combinator nullable with a { type: null } branch, which renders and validates null', () => {
        const openapi = subjectOpenapi({
          description: 'the pet, when there is one',
          anyOf: [{ type: 'object', required: ['name'], properties: { name: 'string' } }, { type: 'null' }],
        })

        expect(openapi).toEqual({
          anyOf: [
            { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
            { type: 'null' },
          ],
          description: 'the pet, when there is one',
        })
        expect(validateObject(null, openapi).errors).toBeUndefined()
        expect(validateObject({ name: 'Fido' }, openapi).errors).toBeUndefined()
        expect(validateObject({}, openapi).isValid).toBe(false)
      })
    })
  })
})
