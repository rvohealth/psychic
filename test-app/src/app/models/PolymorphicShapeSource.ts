import { Decorators } from '@rvoh/dream'
import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'
import PolymorphicShapeTargetA from './PolymorphicShapeTargetA.js'
import PolymorphicShapeTargetB from './PolymorphicShapeTargetB.js'

const deco = new Decorators<typeof PolymorphicShapeSource>()

/**
 * Belongs to PolymorphicShapeTargetA or PolymorphicShapeTargetB through a
 * polymorphic association, declared once in each order of the targets, for the
 * specs of a serializer attribute delegated through a polymorphic association.
 */
export default class PolymorphicShapeSource extends ApplicationModel {
  public override get table() {
    return 'polymorphic_shape_sources' as const
  }

  public id: DreamColumn<PolymorphicShapeSource, 'id'>
  public createdAt: DreamColumn<PolymorphicShapeSource, 'createdAt'>
  public updatedAt: DreamColumn<PolymorphicShapeSource, 'updatedAt'>

  @deco.BelongsTo(['PolymorphicShapeTargetA', 'PolymorphicShapeTargetB'], {
    on: 'targetId',
    polymorphic: true,
  })
  public target: PolymorphicShapeTargetA | PolymorphicShapeTargetB
  public targetId: DreamColumn<PolymorphicShapeSource, 'targetId'>
  public targetType: DreamColumn<PolymorphicShapeSource, 'targetType'>

  @deco.BelongsTo(['PolymorphicShapeTargetB', 'PolymorphicShapeTargetA'], {
    on: 'targetId',
    polymorphic: true,
  })
  public targetInReverseOrder: PolymorphicShapeTargetB | PolymorphicShapeTargetA
}
