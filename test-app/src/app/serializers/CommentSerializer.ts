import { Attribute, DreamColumn, DreamSerializer, RendersOne } from '@rvoh/dream'
import Comment from '../models/Comment.js'
import User from '../models/User.js'

export class CommentSummarySerializer<
  DataType extends Comment,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute(Comment)
  public id: DreamColumn<Comment, 'id'>

  // `body` in CommentSummarySerializer, which is inherited by CommentSerializer,
  // which also includes a `body` Attribute reproduced an error in a Psychic project
  // wherein the same attribute appeared multiple times as a `required` attribute,
  // which is invalid OpenAPI. However, with modern decorators, this is no longer possible.
  @Attribute(Comment)
  public body: DreamColumn<Comment, 'body'>
}

export default class CommentSerializer<
  DataType extends Comment,
  Passthrough extends object,
> extends CommentSummarySerializer<DataType, Passthrough> {}

export class CommentWithFlattenedUserSerializer extends DreamSerializer {
  @Attribute(Comment)
  public body: DreamColumn<Comment, 'body'>

  @RendersOne(User, { flatten: true })
  public user: DreamColumn<Comment, 'body'>
}

export class CommentWithAnyOfArraySerializer extends DreamSerializer {
  @Attribute({
    type: 'array',
    items: {
      anyOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })
  public howyadoin: string | boolean
}

export class CommentWithAllOfArraySerializer extends DreamSerializer {
  @Attribute({
    type: 'array',
    items: {
      allOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })
  public howyadoin: string | boolean
}

export class CommentWithOneOfArraySerializer extends DreamSerializer {
  @Attribute({
    type: 'array',
    items: {
      oneOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })
  public howyadoin: string | boolean
}

export class CommentWithAnyOfObjectSerializer extends DreamSerializer {
  @Attribute({
    anyOf: [{ type: 'string' }, { type: 'boolean' }],
  })
  public howyadoin: string | boolean
}

export class CommentWithAllOfObjectSerializer extends DreamSerializer {
  @Attribute({
    allOf: [{ type: 'string' }, { type: 'boolean' }],
  })
  public howyadoin: string | boolean
}

export class CommentWithOneOfObjectSerializer extends DreamSerializer {
  @Attribute({
    oneOf: [{ type: 'string' }, { type: 'boolean' }],
  })
  public howyadoin: string | boolean
}

export class CommentTestingDefaultObjectFieldsSerializer extends DreamSerializer {
  @Attribute({
    type: 'object',
    minProperties: 8,
    maxProperties: 10,
    additionalProperties: {
      oneOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })
  public howyadoin: string | boolean
}

export class CommentTestingDefaultNullFieldsSerializer extends DreamSerializer {
  @Attribute({
    oneOf: [{ type: 'null' }, { type: 'string' }],
  })
  public howyadoin: null
}

export class CommentTestingIntegerSerializer extends DreamSerializer {
  @Attribute({
    type: 'integer',
    minimum: 10,
    maximum: 20,
  })
  public howyadoin: number
}

export class CommentTestingIntegerShorthandSerializer extends DreamSerializer {
  @Attribute('integer')
  public howyadoin: number
}

export class CommentTestingDecimalSerializer extends DreamSerializer {
  @Attribute({
    type: 'number',
    format: 'decimal',
    minimum: 10,
    maximum: 20,
  })
  public howyadoin: number
}

export class CommentTestingDecimalShorthandSerializer extends DreamSerializer {
  @Attribute('decimal')
  public howyadoin: number
}

export class CommentTestingDoubleSerializer extends DreamSerializer {
  @Attribute({
    type: 'number',
    format: 'double',
    multipleOf: 2.5,
    minimum: 10,
    maximum: 20,
  })
  public howyadoin: number
}

export class CommentTestingDoubleShorthandSerializer extends DreamSerializer {
  @Attribute('double')
  public howyadoin: number
}

export class CommentTestingDoubleArrayShorthandSerializer extends DreamSerializer {
  @Attribute('double[]')
  public howyadoin: number[]
}

export class CommentTestingDateSerializer extends DreamSerializer {
  @Attribute('date')
  public howyadoin: string

  @Attribute('date[]')
  public howyadoins: string
}

export class CommentTestingDateTimeSerializer extends DreamSerializer {
  @Attribute('date-time')
  public howyadoin: string

  @Attribute('date-time[]')
  public howyadoins: string
}

export class CommentTestingBasicSerializerRefSerializer extends DreamSerializer {
  @Attribute({
    $serializer: CommentTestingDoubleShorthandSerializer,
  })
  public howyadoin: string
}

export class CommentTestingBasicArraySerializerRefSerializer extends DreamSerializer {
  @Attribute({
    $serializer: CommentTestingDoubleShorthandSerializer,
    many: true,
  })
  public howyadoin: string
}

export class CommentTestingBasicArraySerializableRefSerializer extends DreamSerializer {
  @Attribute({
    $serializable: Comment,
    many: true,
  })
  public howyadoin: string
}

export class CommentTestingRootSerializerRefSerializer extends DreamSerializer {
  @Attribute({
    $serializer: CommentTestingDoubleShorthandSerializer,
  })
  public nonNullableHowyadoin: string

  @Attribute({
    $serializer: CommentTestingDoubleShorthandSerializer,
    many: true,
  })
  public nonNullableHowyadoins: string

  @Attribute({
    $serializer: CommentTestingDoubleShorthandSerializer,
    nullable: true,
  })
  public singleHowyadoin: string

  @Attribute({
    $serializer: CommentTestingDoubleShorthandSerializer,
    many: true,
    nullable: true,
  })
  public manyHowyadoins: string
}

export class CommentTestingObjectWithSerializerRefSerializer extends DreamSerializer {
  @Attribute({
    type: 'object',
    properties: {
      myProperty: {
        $serializer: CommentTestingDoubleShorthandSerializer,
      },
      myProperties: {
        $serializer: CommentTestingDoubleShorthandSerializer,
        many: true,
      },
      myNullableProperty: {
        $serializer: CommentTestingDoubleShorthandSerializer,
        nullable: true,
      },
      myNullableProperties: {
        $serializer: CommentTestingDoubleShorthandSerializer,
        many: true,
        nullable: true,
      },
    },
  })
  public howyadoin: string
}

export class CommentTestingArrayWithSerializerRefSerializer extends DreamSerializer {
  @Attribute({
    type: 'array',
    items: {
      $serializer: CommentTestingDoubleShorthandSerializer,
    },
  })
  public howyadoins: string

  @Attribute({
    type: 'array',
    items: {
      $serializer: CommentTestingDoubleShorthandSerializer,
      nullable: true,
    },
  })
  public nullableHowyadoins: string

  @Attribute({
    type: 'array',
    items: {
      $serializer: CommentTestingDoubleShorthandSerializer,
      many: true,
    },
  })
  public howyadoinsNestedArray: string
}

export class CommentTestingStringSerializer extends DreamSerializer {
  @Attribute({
    type: 'string',
    enum: ['hello', 'world'],
    format: 'date',
    pattern: '/^helloworld$/',
    minLength: 2,
    maxLength: 4,
  })
  public howyadoin: string
}

export class CommentTestingStringShorthandSerializer extends DreamSerializer {
  @Attribute('string')
  public howyadoin: string
}

export class CommentTestingStringArrayShorthandSerializer extends DreamSerializer {
  @Attribute('string[]')
  public howyadoin: string
}

export class CommentTestingStringArraySerializer extends DreamSerializer {
  @Attribute({
    type: 'array',
    description: 'my array',
    items: {
      type: 'string',
      nullable: true,
      description: 'my array item',
    },
  })
  public howyadoin: string
}

export class CommentTestingAdditionalPropertiesShorthandSerializer extends DreamSerializer {
  @Attribute({ type: 'object', additionalProperties: 'number' })
  public howyadoin: Record<string, number>
}

export class CommentTestingAdditionalPropertiesSerializer extends DreamSerializer {
  @Attribute({
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: { code: { type: 'integer' }, text: { type: 'string' } },
    },
  })
  public howyadoin: Record<string, { code: string; text: string }>
}

export class Comment1OnlyUsedInOneControllerSerializer extends DreamSerializer {
  @Attribute('date')
  public howyadoin: string
}

export class Comment2OnlyUsedInOneControllerSerializer extends DreamSerializer {
  @Attribute('date[]')
  public howyadoins: string
}
