import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<typeof SimpleSerializerModel>()

export default class SimpleSerializerModel extends ApplicationModel {
  public override get table() {
    return 'simple_serializer_models' as const
  }

  public get serializers(): DreamSerializers<SimpleSerializerModel> {
    return {
      default: 'SimpleSerializerModelSerializer',
      summary: 'SimpleSerializerModelSummarySerializer',
    }
  }

  public id: DreamColumn<SimpleSerializerModel, 'id'>
  public name: DreamColumn<SimpleSerializerModel, 'name'>
  public createdAt: DreamColumn<SimpleSerializerModel, 'createdAt'>
  public updatedAt: DreamColumn<SimpleSerializerModel, 'updatedAt'>
}
