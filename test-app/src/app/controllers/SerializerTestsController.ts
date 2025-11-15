import { MissingSerializersDefinition } from '@rvoh/dream/errors'
import ModelWithoutSerializer from '../models/ModelWithoutSerializer.js'
import SimpleSerializerModel from '../models/SimpleSerializerModel.js'
import ApplicationController from './ApplicationController.js'

export default class SerializerTestsController extends ApplicationController {
  public async nakedDream() {
    const model = await ModelWithoutSerializer.firstOrFail()
    try {
      this.ok(model)
    } catch (error) {
      if (error instanceof MissingSerializersDefinition) this.ok('MissingSerializersDefinition')
      else if (error instanceof Error) this.ok(error.constructor.name)
    }
  }

  public async sanitized() {
    const model = await SimpleSerializerModel.firstOrFail()
    this.ok(model)
  }
}
