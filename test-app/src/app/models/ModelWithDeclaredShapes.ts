import { CalendarDate, DateTime, Decorators } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof ModelWithDeclaredShapes>()

/**
 * Declares, with the real decorators, the shapes the specs of Params.for and of
 * the OpenAPI renderer need beyond the few User declares, so those specs read
 * declarations Dream registered and checked at boot.
 */
export default class ModelWithDeclaredShapes extends ApplicationModel {
  public override get table() {
    return 'models_with_declared_shapes' as const
  }

  public id: DreamColumn<ModelWithDeclaredShapes, 'id'>
  public createdAt: DreamColumn<ModelWithDeclaredShapes, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithDeclaredShapes, 'updatedAt'>

  // begin: @deco.JSON columns

  // a nullable jsonb column
  @deco.JSON({ type: 'object', properties: { hello: 'string' } })
  public nullableObject: DreamColumn<ModelWithDeclaredShapes, 'nullableObject'>

  // a nullable jsonb[] column, whose shape describes each element
  @deco.JSON({ type: 'object', properties: { hello: 'string' } })
  public nullableObjects: DreamColumn<ModelWithDeclaredShapes, 'nullableObjects'>

  // a nullable json column whose shape has no `type` of its own
  @deco.JSON({
    anyOf: [
      { type: 'object', properties: { hello: 'string' }, required: ['hello'] },
      { type: 'object', properties: { goodbye: 'string' }, required: ['goodbye'] },
    ],
  })
  public nullableComposition: DreamColumn<ModelWithDeclaredShapes, 'nullableComposition'>

  @deco.JSON({ type: 'object', properties: { phone: { type: 'string', pattern: '^\\d{3}-\\d{4}$' } } })
  public patterned: DreamColumn<ModelWithDeclaredShapes, 'patterned'>

  // `default` is not in Dream's shorthand types, so only a declaration that
  // gets past them (as this cast does, or plain JavaScript) carries one
  @deco.JSON({
    type: 'object',
    properties: { withDefault: { type: 'string', default: 'injected' } },
  } as never)
  public withDefault: DreamColumn<ModelWithDeclaredShapes, 'withDefault'>

  // end: @deco.JSON columns

  // a not-null jsonb column that declares no shape, for contrast
  public undeclaredRequiredJsonb: DreamColumn<ModelWithDeclaredShapes, 'undeclaredRequiredJsonb'>

  // begin: @deco.Encrypted attributes, each over a backing column that allows null

  @deco.Encrypted({ openapi: 'integer' })
  public integerSecret: DreamColumn<ModelWithDeclaredShapes, 'integerSecret'>

  @deco.Encrypted({ openapi: { type: 'date' } })
  public dateSecret: DreamColumn<ModelWithDeclaredShapes, 'dateSecret'>

  @deco.Encrypted({ openapi: { type: 'date-time' } })
  public dateTimeSecret: DreamColumn<ModelWithDeclaredShapes, 'dateTimeSecret'>

  @deco.Encrypted({ openapi: { type: 'decimal' } })
  public decimalSecret: DreamColumn<ModelWithDeclaredShapes, 'decimalSecret'>

  @deco.Encrypted({ openapi: { type: 'integer[]' } })
  public integerArraySecret: DreamColumn<ModelWithDeclaredShapes, 'integerArraySecret'>

  @deco.Encrypted({ openapi: { type: ['decimal', 'null'] } })
  public nullableDecimalSecret: DreamColumn<ModelWithDeclaredShapes, 'nullableDecimalSecret'>

  // end: @deco.Encrypted attributes

  // begin: @deco.Virtual attributes whose shape is more than a primitive

  @deco.Virtual({
    type: 'object',
    properties: { a: 'integer', nested: { type: 'object', properties: { b: 'string' } } },
    required: ['a'],
  })
  public objectVirtual: { a: number; nested?: { b?: string } } | undefined

  @deco.Virtual({ type: ['object', 'null'], properties: { a: 'integer' } })
  public nullableObjectVirtual: { a?: number } | null | undefined

  @deco.Virtual({ type: 'array', items: { type: 'object', properties: { a: 'integer' }, required: ['a'] } })
  public objectArrayVirtual: { a: number }[] | undefined

  @deco.Virtual({ type: 'string', enum: ['red', 'green'] })
  public enumVirtual: 'red' | 'green' | undefined

  @deco.Virtual({ type: 'array', items: { type: 'string', enum: ['red', 'green'] } })
  public enumArrayVirtual: ('red' | 'green')[] | undefined

  @deco.Virtual({ type: 'string', format: 'date', enum: ['2026-11-19', '2026-11-20'] })
  public dateEnumVirtual: CalendarDate | undefined

  @deco.Virtual({ type: 'string', format: 'date-time', enum: ['2026-11-19T10:00:00.000Z'] })
  public dateTimeEnumVirtual: DateTime | undefined

  @deco.Virtual({
    type: 'array',
    items: { type: 'string', format: 'date', enum: ['2026-11-19', '2026-11-20'] },
  })
  public dateEnumArrayVirtual: CalendarDate[] | undefined

  @deco.Virtual({
    type: 'array',
    items: { type: 'string', format: 'date-time', enum: ['2026-11-19T10:00:00.000Z'] },
  })
  public dateTimeEnumArrayVirtual: DateTime[] | undefined

  @deco.Virtual('json')
  public jsonVirtual: object | undefined

  // `'bigint'` is not a Dream shorthand, so only a declaration that gets past
  // the types (as this cast does, or plain JavaScript) names it
  @deco.Virtual('bigint' as never)
  public bigintVirtual: string | undefined

  // end: @deco.Virtual attributes whose shape is more than a primitive

  // begin: an array declared through `items`, beside the `integer[]` shorthands below

  @deco.Virtual({ type: 'array', items: { type: 'integer' } })
  public integerArrayItemsForm: number[] | undefined

  @deco.Virtual({ type: ['array', 'null'], items: { type: 'integer' } })
  public nullableIntegerArrayItemsForm: number[] | null | undefined

  @deco.Virtual({ type: 'array', items: { type: ['integer', 'null'] } })
  public integerArrayOfNullableItems: (number | null)[] | undefined

  @deco.Virtual({ type: 'array', items: { type: 'date-time' } })
  public dateTimeArrayItemsForm: DateTime[] | undefined

  // end: an array declared through `items`

  // begin: every primitive shorthand, its array and their nullable variants,
  // each declared both as the string (`'decimal'`) and in object form
  // (`{ type: 'decimal' }`)

  @deco.Virtual('decimal')
  public decimalStringForm: number | undefined

  @deco.Virtual({ type: 'decimal' })
  public decimalObjectForm: number | undefined

  @deco.Virtual('decimal[]')
  public decimalArrayStringForm: number[] | undefined

  @deco.Virtual({ type: 'decimal[]' })
  public decimalArrayObjectForm: number[] | undefined

  @deco.Virtual(['decimal', 'null'])
  public nullableDecimalStringForm: number | null | undefined

  @deco.Virtual({ type: ['decimal', 'null'] })
  public nullableDecimalObjectForm: number | null | undefined

  @deco.Virtual(['decimal[]', 'null'])
  public nullableDecimalArrayStringForm: number[] | null | undefined

  @deco.Virtual({ type: ['decimal[]', 'null'] })
  public nullableDecimalArrayObjectForm: number[] | null | undefined

  @deco.Virtual('date')
  public dateStringForm: CalendarDate | undefined

  @deco.Virtual({ type: 'date' })
  public dateObjectForm: CalendarDate | undefined

  @deco.Virtual('date[]')
  public dateArrayStringForm: CalendarDate[] | undefined

  @deco.Virtual({ type: 'date[]' })
  public dateArrayObjectForm: CalendarDate[] | undefined

  @deco.Virtual(['date', 'null'])
  public nullableDateStringForm: CalendarDate | null | undefined

  @deco.Virtual({ type: ['date', 'null'] })
  public nullableDateObjectForm: CalendarDate | null | undefined

  @deco.Virtual(['date[]', 'null'])
  public nullableDateArrayStringForm: CalendarDate[] | null | undefined

  @deco.Virtual({ type: ['date[]', 'null'] })
  public nullableDateArrayObjectForm: CalendarDate[] | null | undefined

  @deco.Virtual('date-time')
  public dateTimeStringForm: DateTime | undefined

  @deco.Virtual({ type: 'date-time' })
  public dateTimeObjectForm: DateTime | undefined

  @deco.Virtual('date-time[]')
  public dateTimeArrayStringForm: DateTime[] | undefined

  @deco.Virtual({ type: 'date-time[]' })
  public dateTimeArrayObjectForm: DateTime[] | undefined

  @deco.Virtual(['date-time', 'null'])
  public nullableDateTimeStringForm: DateTime | null | undefined

  @deco.Virtual({ type: ['date-time', 'null'] })
  public nullableDateTimeObjectForm: DateTime | null | undefined

  @deco.Virtual(['date-time[]', 'null'])
  public nullableDateTimeArrayStringForm: DateTime[] | null | undefined

  @deco.Virtual({ type: ['date-time[]', 'null'] })
  public nullableDateTimeArrayObjectForm: DateTime[] | null | undefined

  @deco.Virtual('integer')
  public integerStringForm: number | undefined

  @deco.Virtual({ type: 'integer' })
  public integerObjectForm: number | undefined

  @deco.Virtual('integer[]')
  public integerArrayStringForm: number[] | undefined

  @deco.Virtual({ type: 'integer[]' })
  public integerArrayObjectForm: number[] | undefined

  @deco.Virtual(['integer', 'null'])
  public nullableIntegerStringForm: number | null | undefined

  @deco.Virtual({ type: ['integer', 'null'] })
  public nullableIntegerObjectForm: number | null | undefined

  @deco.Virtual(['integer[]', 'null'])
  public nullableIntegerArrayStringForm: number[] | null | undefined

  @deco.Virtual({ type: ['integer[]', 'null'] })
  public nullableIntegerArrayObjectForm: number[] | null | undefined

  @deco.Virtual('number')
  public numberStringForm: number | undefined

  @deco.Virtual({ type: 'number' })
  public numberObjectForm: number | undefined

  @deco.Virtual('number[]')
  public numberArrayStringForm: number[] | undefined

  @deco.Virtual({ type: 'number[]' })
  public numberArrayObjectForm: number[] | undefined

  @deco.Virtual(['number', 'null'])
  public nullableNumberStringForm: number | null | undefined

  @deco.Virtual({ type: ['number', 'null'] })
  public nullableNumberObjectForm: number | null | undefined

  @deco.Virtual(['number[]', 'null'])
  public nullableNumberArrayStringForm: number[] | null | undefined

  @deco.Virtual({ type: ['number[]', 'null'] })
  public nullableNumberArrayObjectForm: number[] | null | undefined

  @deco.Virtual('string')
  public stringStringForm: string | undefined

  @deco.Virtual({ type: 'string' })
  public stringObjectForm: string | undefined

  @deco.Virtual('string[]')
  public stringArrayStringForm: string[] | undefined

  @deco.Virtual({ type: 'string[]' })
  public stringArrayObjectForm: string[] | undefined

  @deco.Virtual(['string', 'null'])
  public nullableStringStringForm: string | null | undefined

  @deco.Virtual({ type: ['string', 'null'] })
  public nullableStringObjectForm: string | null | undefined

  @deco.Virtual(['string[]', 'null'])
  public nullableStringArrayStringForm: string[] | null | undefined

  @deco.Virtual({ type: ['string[]', 'null'] })
  public nullableStringArrayObjectForm: string[] | null | undefined

  @deco.Virtual('boolean')
  public booleanStringForm: boolean | undefined

  @deco.Virtual({ type: 'boolean' })
  public booleanObjectForm: boolean | undefined

  @deco.Virtual('boolean[]')
  public booleanArrayStringForm: boolean[] | undefined

  @deco.Virtual({ type: 'boolean[]' })
  public booleanArrayObjectForm: boolean[] | undefined

  @deco.Virtual(['boolean', 'null'])
  public nullableBooleanStringForm: boolean | null | undefined

  @deco.Virtual({ type: ['boolean', 'null'] })
  public nullableBooleanObjectForm: boolean | null | undefined

  @deco.Virtual(['boolean[]', 'null'])
  public nullableBooleanArrayStringForm: boolean[] | null | undefined

  @deco.Virtual({ type: ['boolean[]', 'null'] })
  public nullableBooleanArrayObjectForm: boolean[] | null | undefined

  // end: every primitive shorthand
}
