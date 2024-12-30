import { describe as context } from '@jest/globals'
import OpenapiBodySegmentRenderer from '../../../../src/openapi-renderer/body-segment'
import { OpenapiBodySegment } from '../../../../src/openapi-renderer/serializer'
import ApplicationController from '../../../../test-app/src/app/controllers/ApplicationController'

describe('OpenapiBodySegmentRenderer', () => {
  describe('#parse', () => {
    const subject = (bodySegment: OpenapiBodySegment) =>
      new OpenapiBodySegmentRenderer({
        controllerClass: ApplicationController,
        bodySegment,
        serializers: {},
        schemaDelimeter: '',
        processedSchemas: {},
        target: 'response',
      }).parse().results

    it('can handle primitive types', () => {
      expect(subject('string')).toEqual({ type: 'string' })
      expect(subject('boolean')).toEqual({ type: 'boolean' })
      expect(subject('number')).toEqual({ type: 'number' })
      expect(subject('integer')).toEqual({ type: 'integer' })
    })

    it('can handle computed types', () => {
      expect(subject('date')).toEqual({ type: 'string', format: 'date' })
      expect(subject('date-time')).toEqual({ type: 'string', format: 'date-time' })
      expect(subject('double')).toEqual({ type: 'number', format: 'double' })
      expect(subject('decimal')).toEqual({ type: 'number', format: 'decimal' })
    })

    context('objects', () => {
      it('preserves description', () => {
        expect(subject({ type: 'string', description: 'hi' })).toEqual({ type: 'string', description: 'hi' })
      })

      it('can handle object primitives', () => {
        expect(subject({ type: 'string' })).toEqual({ type: 'string' })
        expect(subject({ type: 'boolean' })).toEqual({ type: 'boolean' })
        expect(subject({ type: 'number' })).toEqual({ type: 'number' })
        expect(subject({ type: 'integer' })).toEqual({ type: 'integer' })
        expect(subject({ type: 'double' })).toEqual({ type: 'number', format: 'double' })
        expect(subject({ type: 'decimal' })).toEqual({ type: 'number', format: 'decimal' })
        expect(subject({ type: 'date' })).toEqual({ type: 'string', format: 'date' })
        expect(subject({ type: 'date-time' })).toEqual({ type: 'string', format: 'date-time' })
      })

      it('can handle objects with primitive arrays for types', () => {
        expect(subject({ type: 'string[]' })).toEqual({ type: 'array', items: { type: 'string' } })
        expect(subject({ type: 'boolean[]' })).toEqual({ type: 'array', items: { type: 'boolean' } })
        expect(subject({ type: 'number[]' })).toEqual({ type: 'array', items: { type: 'number' } })
        expect(subject({ type: 'integer[]' })).toEqual({ type: 'array', items: { type: 'integer' } })
        expect(subject({ type: 'double[]' })).toEqual({
          type: 'array',
          items: { type: 'number', format: 'double' },
        })
        expect(subject({ type: 'decimal[]' })).toEqual({
          type: 'array',
          items: { type: 'number', format: 'decimal' },
        })
        expect(subject({ type: 'date[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date' },
        })
        expect(subject({ type: 'date-time[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date-time' },
        })
      })
    })

    context('arrays', () => {
      it('preserves description', () => {
        expect(subject({ type: 'string[]', description: 'hi' })).toEqual({
          type: 'array',
          description: 'hi',
          items: { type: 'string' },
        })

        expect(
          subject({ type: 'array', description: 'hi', items: { type: 'string', description: 'hi2' } }),
        ).toEqual({
          type: 'array',
          description: 'hi',
          items: { type: 'string', description: 'hi2' },
        })
      })

      it('can handle primitive array types', () => {
        expect(subject('string[]')).toEqual({ type: 'array', items: { type: 'string' } })
        expect(subject('boolean[]')).toEqual({ type: 'array', items: { type: 'boolean' } })
        expect(subject('number[]')).toEqual({ type: 'array', items: { type: 'number' } })
        expect(subject('integer[]')).toEqual({ type: 'array', items: { type: 'integer' } })
        expect(subject('double[]')).toEqual({ type: 'array', items: { type: 'number', format: 'double' } })
        expect(subject('decimal[]')).toEqual({ type: 'array', items: { type: 'number', format: 'decimal' } })
        expect(subject('date[]')).toEqual({ type: 'array', items: { type: 'string', format: 'date' } })
        expect(subject('date-time[]')).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date-time' },
        })
      })

      it('can handle object primitive arrays', () => {
        expect(subject({ type: 'string[]' })).toEqual({ type: 'array', items: { type: 'string' } })
        expect(subject({ type: 'boolean[]' })).toEqual({ type: 'array', items: { type: 'boolean' } })
        expect(subject({ type: 'number[]' })).toEqual({ type: 'array', items: { type: 'number' } })
        expect(subject({ type: 'integer[]' })).toEqual({ type: 'array', items: { type: 'integer' } })
        expect(subject({ type: 'double[]' })).toEqual({
          type: 'array',
          items: { type: 'number', format: 'double' },
        })
        expect(subject({ type: 'decimal[]' })).toEqual({
          type: 'array',
          items: { type: 'number', format: 'decimal' },
        })
        expect(subject({ type: 'date[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date' },
        })
        expect(subject({ type: 'date-time[]' })).toEqual({
          type: 'array',
          items: { type: 'string', format: 'date-time' },
        })
      })
    })
  })
})
