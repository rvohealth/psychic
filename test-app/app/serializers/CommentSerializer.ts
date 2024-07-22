import { Attribute, DreamColumn, DreamSerializer } from '@rvohealth/dream'
import Comment from '../models/Comment'

export class CommentSummarySerializer<
  DataType extends Comment,
  Passthrough extends object,
> extends DreamSerializer<DataType, Passthrough> {
  @Attribute('string')
  public id: DreamColumn<Comment, 'id'>
}

export default class CommentSerializer<
  DataType extends Comment,
  Passthrough extends object,
> extends CommentSummarySerializer<DataType, Passthrough> {
  @Attribute('string')
  public body: DreamColumn<Comment, 'body'>
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
    maxProperties: 10,
    additionalProperties: {
      oneOf: [{ type: 'string' }, { type: 'boolean' }],
    },
  })
  public howyadoin: string | boolean
}

export class CommentTestingIntegerSerializer extends DreamSerializer {
  @Attribute({
    type: 'integer',
    minimum: 10,
    maximum: 20,
  })
  public howyadoin: number
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

export class CommentTestingStringSerializer extends DreamSerializer {
  @Attribute({
    type: 'string',
    enum: ['hello', 'world'],
    format: 'date',
  })
  public howyadoin: string
}
