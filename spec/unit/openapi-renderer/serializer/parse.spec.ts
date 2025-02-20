import { describe as context } from '@jest/globals'
import { DreamSerializer } from '@rvohealth/dream'
import OpenapiSerializerRenderer from '../../../../src/openapi-renderer/serializer'
import {
  CommentTestingAdditionalPropertiesSerializer,
  CommentTestingAdditionalPropertiesShorthandSerializer,
  CommentTestingDateSerializer,
  CommentTestingDateTimeSerializer,
  CommentTestingDecimalSerializer,
  CommentTestingDecimalShorthandSerializer,
  CommentTestingDoubleSerializer,
  CommentTestingDoubleShorthandSerializer,
  CommentTestingIntegerSerializer,
  CommentTestingIntegerShorthandSerializer,
  CommentTestingStringArraySerializer,
  CommentTestingStringArrayShorthandSerializer,
  CommentTestingStringSerializer,
  CommentTestingStringShorthandSerializer,
  CommentWithFlattenedUserSerializer,
} from '../../../../test-app/src/app/serializers/CommentSerializer'
import PostSerializer from '../../../../test-app/src/app/serializers/PostSerializer'
import ApplicationController from '../../../../test-app/src/app/controllers/ApplicationController'

describe('OpenapiSerializerRenderer', () => {
  describe('#parse', () => {
    const subject = (serializerClass: typeof DreamSerializer) =>
      new OpenapiSerializerRenderer({
        openapiName: 'default',
        controllerClass: ApplicationController,
        serializerClass,
        serializers: {},
        schemaDelimeter: '',
        processedSchemas: {},
        target: 'response',
      }).parse()

    context('data types', () => {
      context('strings', () => {
        it('shorthand', () => {
          expect(subject(CommentTestingStringShorthandSerializer)).toEqual({
            CommentTestingStringShorthand: {
              properties: {
                howyadoin: {
                  type: 'string',
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })

        it('full', () => {
          expect(subject(CommentTestingStringSerializer)).toEqual({
            CommentTestingString: {
              properties: {
                howyadoin: {
                  type: 'string',
                  enum: ['hello', 'world'],
                  format: 'date',
                  pattern: '/^helloworld$/',
                  minLength: 2,
                  maxLength: 4,
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })

        it('array shorthand', () => {
          expect(subject(CommentTestingStringArrayShorthandSerializer)).toEqual({
            CommentTestingStringArrayShorthand: {
              properties: {
                howyadoin: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })

        it('array full', () => {
          expect(subject(CommentTestingStringArraySerializer)).toEqual({
            CommentTestingStringArray: {
              properties: {
                howyadoin: {
                  type: 'array',
                  description: 'my array',
                  items: {
                    type: 'string',
                    nullable: true,
                    description: 'my array item',
                  },
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })
      })

      context('integers', () => {
        it('shorthand', () => {
          expect(subject(CommentTestingIntegerShorthandSerializer)).toEqual({
            CommentTestingIntegerShorthand: {
              properties: {
                howyadoin: {
                  type: 'integer',
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })

        it('full', () => {
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

      context('decimals', () => {
        it('shorthand', () => {
          expect(subject(CommentTestingDecimalShorthandSerializer)).toEqual({
            CommentTestingDecimalShorthand: {
              properties: {
                howyadoin: {
                  type: 'number',
                  format: 'decimal',
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })

        it('full', () => {
          expect(subject(CommentTestingDecimalSerializer)).toEqual({
            CommentTestingDecimal: {
              properties: {
                howyadoin: {
                  maximum: 20,
                  minimum: 10,
                  type: 'number',
                  format: 'decimal',
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })
      })

      context('doubles', () => {
        it('shorthand', () => {
          expect(subject(CommentTestingDoubleShorthandSerializer)).toEqual({
            CommentTestingDoubleShorthand: {
              properties: {
                howyadoin: {
                  type: 'number',
                  format: 'double',
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })

        it('full', () => {
          expect(subject(CommentTestingDoubleSerializer)).toEqual({
            CommentTestingDouble: {
              properties: {
                howyadoin: {
                  maximum: 20,
                  minimum: 10,
                  type: 'number',
                  format: 'double',
                  multipleOf: 2.5,
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })
      })

      context('dates', () => {
        it('shorthand', () => {
          expect(subject(CommentTestingDateSerializer)).toEqual({
            CommentTestingDate: {
              properties: {
                howyadoin: {
                  type: 'string',
                  format: 'date',
                },
                howyadoins: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'date',
                  },
                },
              },
              required: ['howyadoin', 'howyadoins'],
              type: 'object',
            },
          })
        })
      })

      context('date-times', () => {
        it('shorthand', () => {
          expect(subject(CommentTestingDateTimeSerializer)).toEqual({
            CommentTestingDateTime: {
              properties: {
                howyadoin: {
                  type: 'string',
                  format: 'date-time',
                },
                howyadoins: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
              required: ['howyadoin', 'howyadoins'],
              type: 'object',
            },
          })
        })
      })

      context('additionalProperties', () => {
        it('shorthand', () => {
          expect(subject(CommentTestingAdditionalPropertiesShorthandSerializer)).toEqual({
            CommentTestingAdditionalPropertiesShorthand: {
              properties: {
                howyadoin: {
                  type: 'object',
                  additionalProperties: {
                    type: 'number',
                  },
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })

        it('full', () => {
          expect(subject(CommentTestingAdditionalPropertiesSerializer)).toEqual({
            CommentTestingAdditionalProperties: {
              properties: {
                howyadoin: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: { code: { type: 'integer' }, text: { type: 'string' } },
                  },
                },
              },
              required: ['howyadoin'],
              type: 'object',
            },
          })
        })
      })
    })

    context('associations', () => {
      context('model provided', () => {
        it('renders relative serializer as ref', () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expect(subject(PostSerializer<any, any>)).toEqual({
            Post: {
              type: 'object',
              required: ['id', 'body', 'comments'],
              properties: {
                id: { type: 'string' },
                body: { type: 'string', nullable: true },
                comments: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Comment' },
                },
              },
            },
            Comment: {
              type: 'object',
              required: ['id', 'body'],
              properties: { id: { type: 'string' }, body: { type: 'string', nullable: true } },
            },
          })
        })
      })

      context('flatten=true', () => {
        it('renders as part of parent serializer', () => {
          expect(subject(CommentWithFlattenedUserSerializer)).toEqual({
            CommentWithFlattenedUser: {
              type: 'object',
              required: ['body', 'id', 'email', 'name'],
              properties: {
                body: { type: 'string', nullable: true },
                id: { type: 'integer' },
                email: { type: 'string' },
                name: { type: 'string', nullable: true },
              },
            },
            User: {
              type: 'object',
              required: ['id', 'email', 'name'],
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                name: { type: 'string', nullable: true },
              },
            },
          })
        })
      })
    })
  })
})
