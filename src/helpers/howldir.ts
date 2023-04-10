import { DreamModel } from 'dream'
import filePath from '../config/helpers/filePath'
import HowlController from '../controller'
import HowlSerializer from '../serializer'

let _models: { [key: string]: DreamModel<any, any> }
let _controllers: { [key: string]: typeof HowlController }
let _serializers: { [key: string]: typeof HowlSerializer }
export default class HowlDir {
  public static async models() {
    if (_models) return _models
    return await this.loadModels()
  }

  public static async loadModels() {
    _models = (await import(filePath('.dream/sync/models'))).default as {
      [key: string]: DreamModel<any, any>
    }
    return _models
  }

  public static async controllers() {
    if (_controllers) return _controllers
    return await this.loadControllers()
  }

  public static async loadControllers() {
    _controllers = (await import(filePath('.howl/controllers'))).default as {
      [key: string]: typeof HowlController
    }
    return _controllers
  }

  public static async serializers() {
    if (_serializers) return _serializers
    return await this.loadSerializers()
  }

  public static async loadSerializers() {
    _serializers = (await import(filePath('.howl/serializers'))).default as {
      [key: string]: typeof HowlSerializer
    }
    return _serializers
  }
}
