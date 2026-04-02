import OpenapiSegmentExpander, {
  OpenapiBodySegment,
  OpenapiBodyTarget,
} from '../../../../src/openapi-renderer/body-segment.js'
import { OpenapiRenderOpts } from '../../../../src/openapi-renderer/endpoint.js'
import User from '../../../../test-app/src/app/models/User.js'
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
    })
  })
})
