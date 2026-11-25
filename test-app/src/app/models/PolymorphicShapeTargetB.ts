import { Decorators } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'

const deco = new Decorators<typeof PolymorphicShapeTargetB>()

/**
 * The other target model of PolymorphicShapeSource's polymorphic association.
 * See PolymorphicShapeTargetA, which says how each pair of declarations
 * compares.
 */
export default class PolymorphicShapeTargetB extends ApplicationModel {
  public override get table() {
    return 'polymorphic_shape_target_bs' as const
  }

  public id: DreamColumn<PolymorphicShapeTargetB, 'id'>
  public createdAt: DreamColumn<PolymorphicShapeTargetB, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicShapeTargetB, 'updatedAt'>

  public plainColumn: DreamColumn<PolymorphicShapeTargetB, 'plainColumn'>

  // begin: @deco.JSON columns

  @deco.JSON({
    type: 'object',
    properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: 'integer' },
  })
  public identicalShape: DreamColumn<PolymorphicShapeTargetB, 'identicalShape'>

  @deco.JSON({ type: 'object', properties: { label: 'string', score: 'number' }, required: ['label'] })
  public identicalElementShape: DreamColumn<PolymorphicShapeTargetB, 'identicalElementShape'>

  @deco.JSON({
    type: 'object',
    properties: { theme: { type: 'string', enum: ['light', 'dark'] }, fontSize: 'integer' },
  })
  public nullableOnB: DreamColumn<PolymorphicShapeTargetB, 'nullableOnB'>

  @deco.JSON({ type: 'object', properties: { theme: 'string' } })
  public differentShape: DreamColumn<PolymorphicShapeTargetB, 'differentShape'>

  @deco.JSON({ type: 'object', properties: { label: 'string' } })
  public arrayOnB: DreamColumn<PolymorphicShapeTargetB, 'arrayOnB'>

  public declaredOnlyOnA: DreamColumn<PolymorphicShapeTargetB, 'declaredOnlyOnA'>

  // end: @deco.JSON columns

  // begin: @deco.Virtual attributes

  @deco.Virtual(['string', 'null'])
  public identicalVirtual: string | null | undefined

  @deco.Virtual({ type: 'object', properties: { label: 'string' } })
  public identicalObjectVirtual: { label?: string } | undefined

  @deco.Virtual('integer')
  public differentVirtual: number | undefined

  @deco.Virtual(['string', 'null'])
  public virtualOnBSecret: string | null | undefined

  @deco.Virtual('integer')
  public integerVirtualOnBSecret: number | undefined

  // end: @deco.Virtual attributes

  // begin: @deco.Encrypted attributes. The backing column is not null here
  // unless noted

  @deco.Encrypted()
  public bareSecret: DreamColumn<PolymorphicShapeTargetB, 'bareSecret'>

  @deco.Encrypted({ openapi: 'integer' })
  public integerSecret: DreamColumn<PolymorphicShapeTargetB, 'integerSecret'>

  @deco.Encrypted({ openapi: ['string', 'null'] })
  public nullableStringSecret: DreamColumn<PolymorphicShapeTargetB, 'nullableStringSecret'>

  // the backing column allows null
  @deco.Encrypted({ openapi: 'integer' })
  public nullDeclaredOnASecret: DreamColumn<PolymorphicShapeTargetB, 'nullDeclaredOnASecret'>

  @deco.Encrypted({ openapi: ['string', 'null'] })
  public explicitNullOnBSecret: DreamColumn<PolymorphicShapeTargetB, 'explicitNullOnBSecret'>

  @deco.Encrypted({ openapi: 'integer' })
  public objectFormNullOnASecret: DreamColumn<PolymorphicShapeTargetB, 'objectFormNullOnASecret'>

  @deco.Encrypted({ openapi: ['integer', 'null'] })
  public mismatchedSecret: DreamColumn<PolymorphicShapeTargetB, 'mismatchedSecret'>

  // end: @deco.Encrypted attributes
}
