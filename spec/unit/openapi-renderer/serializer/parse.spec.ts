import { DreamSerializer } from '@rvohealth/dream'
import OpenapiSerializerRenderer from '../../../../src/openapi-renderer/serializer'
import { CommentTestingIntegerSerializer } from '../../../../test-app/app/serializers/CommentSerializer'

describe('OpenapiBodySegmentRenderer', () => {
  describe('#parse', () => {
    const subject = (serializerClass: typeof DreamSerializer) =>
      new OpenapiSerializerRenderer({
        serializerClass,
        serializers: {},
        schemaDelimeter: '',
        processedSchemas: {},
        target: 'response',
      }).parse()

    it('can handle integer types', () => {
      expect(subject(CommentTestingIntegerSerializer)).toEqual({
        CommentTestingInteger: {
          properties: {
            howyadoin: {
              maximum: 20,
              minimum: 10,
              type: 'integer',
            },
          },
          required: ['howyadoin'],
          type: 'object',
        },
      })
    })
  })
})
