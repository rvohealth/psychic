import { DreamColumn } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'

// const deco = new Decorators<typeof ModelWithoutSerializer>()

export default class ModelWithoutSerializer extends ApplicationModel {
  public override get table() {
    return 'model_without_serializers' as const
  }

  public id: DreamColumn<ModelWithoutSerializer, 'id'>
  public name: DreamColumn<ModelWithoutSerializer, 'name'>
  public createdAt: DreamColumn<ModelWithoutSerializer, 'createdAt'>
  public updatedAt: DreamColumn<ModelWithoutSerializer, 'updatedAt'>
}
