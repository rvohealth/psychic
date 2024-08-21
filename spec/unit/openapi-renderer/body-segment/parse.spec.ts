import OpenapiBodySegmentRenderer from '../../../../src/openapi-renderer/body-segment'

describe('OpenapiBodySegmentRenderer', () => {
  describe('#parse', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subject = (bodySegment: any) =>
      new OpenapiBodySegmentRenderer({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    it('can handle array types', () => {
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
