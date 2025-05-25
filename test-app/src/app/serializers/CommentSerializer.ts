/* eslint-disable @typescript-eslint/no-explicit-any */
import { DreamSerializer, SimpleObjectSerializer } from '@rvoh/dream'
import Comment from '../models/Comment.js'

const CommentSummarySerializer = (data: Comment, passthrough: object) =>
  DreamSerializer(Comment, data, passthrough)
    .attribute('id')
    // `body` in CommentSummarySerializer, which is inherited by CommentSerializer,
    // which also includes a `body` Attribute reproduced an error in a Psychic project
    // wherein the same attribute appeared multiple times as a `required` attribute,
    // which is invalid OpenAPI. However, with modern decorators, this is no longer possible.
    .attribute('body')

export default (data: Comment, passthrough: object) => CommentSummarySerializer(data, passthrough)

export const CommentWithFlattenedUserSerializer = (data: Comment) =>
  DreamSerializer(Comment, data).attribute('body').rendersOne('post', { flatten: true })

export const CommentWithAnyOfArraySerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'array',
      items: {
        anyOf: [{ type: 'string' }, { type: 'boolean' }],
      },
    },
  })

export const CommentWithAllOfArraySerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'array',
      items: {
        allOf: [{ type: 'string' }, { type: 'boolean' }],
      },
    },
  })

export const CommentWithOneOfArraySerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'array',
      items: {
        oneOf: [{ type: 'string' }, { type: 'boolean' }],
      },
    },
  })

export const CommentWithAnyOfObjectSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      anyOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })

export const CommentWithAllOfObjectSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      allOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })

export const CommentWithOneOfObjectSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      oneOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })

export const CommentTestingDefaultObjectFieldsSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'object',
      minProperties: 8,
      maxProperties: 10,
      additionalProperties: {
        oneOf: [{ type: 'string' }, { type: 'boolean' }],
      },
    },
  })

export const CommentTestingDefaultNullFieldsSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      oneOf: [{ type: 'null' }, { type: 'string' }],
    },
  })

export const CommentTestingIntegerSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'integer',
      minimum: 10,
      maximum: 20,
    },
  })

export const CommentTestingIntegerShorthandSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: 'integer',
  })

export const CommentTestingDecimalSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'number',
      format: 'decimal',
      minimum: 10,
      maximum: 20,
    },
  })

export const CommentTestingDecimalShorthandSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: 'decimal',
  })

export const CommentTestingDoubleSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'number',
      format: 'double',
      multipleOf: 2.5,
      minimum: 10,
      maximum: 20,
    },
  })

export const CommentTestingDateSerializer = (data: any) =>
  SimpleObjectSerializer(data)
    .attribute('howyadoin', { openapi: 'date' })
    .attribute('howyadoin', { openapi: 'date[]' })

export const CommentTestingDateTimeSerializer = (data: any) =>
  SimpleObjectSerializer(data)
    .attribute('howyadoin', { openapi: 'date-time' })
    .attribute('howyadoin', { openapi: 'date-time[]' })

export const CommentTestingStringSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'string',
      enum: ['hello', 'world'],
      format: 'date',
      pattern: '/^helloworld$/',
      minLength: 2,
      maxLength: 4,
    },
  })

export const CommentTestingStringShorthandSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', { openapi: 'string' })

export const CommentTestingStringArrayShorthandSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', { openapi: 'string[]' })

export const CommentTestingStringArraySerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'array',
      description: 'my array',
      items: {
        type: ['null', 'string'],
        description: 'my array item',
      },
    },
  })

export const CommentTestingAdditionalPropertiesShorthandSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: { type: 'object', additionalProperties: 'number' },
  })

export const CommentTestingAdditionalPropertiesSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', {
    openapi: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { code: { type: 'integer' }, text: { type: 'string' } },
      },
    },
  })

export const Comment1OnlyUsedInOneControllerSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', { openapi: 'date' })

export const Comment2OnlyUsedInOneControllerSerializer = (data: any) =>
  SimpleObjectSerializer(data).attribute('howyadoin', { openapi: 'date[]' })
