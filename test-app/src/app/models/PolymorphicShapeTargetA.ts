import { Decorators } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof PolymorphicShapeTargetA>()

/**
 * One of the two target models of PolymorphicShapeSource's polymorphic
 * association. Each attribute is declared here and on PolymorphicShapeTargetB
 * under the same name, and its name says how the two declarations (or their
 * columns) compare, for the specs of a serializer attribute delegated through
 * a polymorphic association.
 */
export default class PolymorphicShapeTargetA extends ApplicationModel {
  public override get table() {
    return 'polymorphic_shape_target_as' as const
  }

  public id: DreamColumn<PolymorphicShapeTargetA, 'id'>
  public createdAt: DreamColumn<PolymorphicShapeTargetA, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicShapeTargetA, 'updatedAt'>

  // a varchar here, an integer on B
  public plainColumn: DreamColumn<PolymorphicShapeTargetA, 'plainColumn'>

  // begin: @deco.JSON columns

  @deco.JSON({
    type: 'object',
    properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: 'integer' },
  })
  public identicalShape: DreamColumn<PolymorphicShapeTargetA, 'identicalShape'>

  // a jsonb[] column on both
  @deco.JSON({ type: 'object', properties: { label: 'string', score: 'number' }, required: ['label'] })
  public identicalElementShape: DreamColumn<PolymorphicShapeTargetA, 'identicalElementShape'>

  // not null here, nullable on B
  @deco.JSON({
    type: 'object',
    properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: 'integer' },
  })
  public nullableOnB: DreamColumn<PolymorphicShapeTargetA, 'nullableOnB'>

  @deco.JSON({
    type: 'object',
    properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: 'integer' },
  })
  public differentShape: DreamColumn<PolymorphicShapeTargetA, 'differentShape'>

  // a jsonb column here, a jsonb[] column on B
  @deco.JSON({ type: 'object', properties: { label: 'string' } })
  public arrayOnB: DreamColumn<PolymorphicShapeTargetA, 'arrayOnB'>

  // B has the column, but does not declare its shape
  @deco.JSON({ type: 'object', properties: { label: 'string' } })
  public declaredOnlyOnA: DreamColumn<PolymorphicShapeTargetA, 'declaredOnlyOnA'>

  // B has no such column
  @deco.JSON({ type: 'object', properties: { label: 'string' } })
  public onlyOnA: DreamColumn<PolymorphicShapeTargetA, 'onlyOnA'>

  // end: @deco.JSON columns

  // begin: @deco.Virtual attributes

  @deco.Virtual(['string', 'null'])
  public identicalVirtual: string | null | undefined

  @deco.Virtual({ type: 'object', properties: { label: 'string' } })
  public identicalObjectVirtual: { label?: string } | undefined

  // an integer on B
  @deco.Virtual(['string', 'null'])
  public differentVirtual: string | null | undefined

  // B has no such attribute
  @deco.Virtual(['string', 'null'])
  public virtualOnlyOnA: string | null | undefined

  // end: @deco.Virtual attributes

  // begin: @deco.Encrypted attributes. The backing column allows null here
  // unless noted

  // the backing column is not null on B
  @deco.Encrypted()
  public bareSecret: DreamColumn<PolymorphicShapeTargetA, 'bareSecret'>

  // the backing column is not null on B
  @deco.Encrypted({ openapi: 'integer' })
  public integerSecret: DreamColumn<PolymorphicShapeTargetA, 'integerSecret'>

  // the backing column is not null on B
  @deco.Encrypted({ openapi: ['string', 'null'] })
  public nullableStringSecret: DreamColumn<PolymorphicShapeTargetA, 'nullableStringSecret'>

  // 'integer' on B, over a backing column that also allows null
  @deco.Encrypted({ openapi: ['integer', 'null'] })
  public nullDeclaredOnASecret: DreamColumn<PolymorphicShapeTargetA, 'nullDeclaredOnASecret'>

  // ['string', 'null'] on B, over a backing column that is not null
  @deco.Encrypted()
  public explicitNullOnBSecret: DreamColumn<PolymorphicShapeTargetA, 'explicitNullOnBSecret'>

  // the backing column is not null here and on B, where the shape is 'integer'
  @deco.Encrypted({ openapi: { type: ['integer', 'null'] } })
  public objectFormNullOnASecret: DreamColumn<PolymorphicShapeTargetA, 'objectFormNullOnASecret'>

  // ['integer', 'null'] on B
  @deco.Encrypted()
  public mismatchedSecret: DreamColumn<PolymorphicShapeTargetA, 'mismatchedSecret'>

  // a @deco.Virtual(['string', 'null']) on B
  @deco.Encrypted()
  public virtualOnBSecret: DreamColumn<PolymorphicShapeTargetA, 'virtualOnBSecret'>

  // a @deco.Virtual('integer') on B
  @deco.Encrypted({ openapi: 'integer' })
  public integerVirtualOnBSecret: DreamColumn<PolymorphicShapeTargetA, 'integerVirtualOnBSecret'>

  // end: @deco.Encrypted attributes
}
