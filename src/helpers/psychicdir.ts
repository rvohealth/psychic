import { DreamModel } from 'dream'
import * as fs from 'fs/promises'
import * as path from 'path'
import filePath from '../config/helpers/filePath'
import PsychicController from '../controller'
import PsychicSerializer from '../serializer'

let _models: { [key: string]: DreamModel<any, any> }
let _controllers: { [key: string]: typeof PsychicController }
let _serializers: { [key: string]: typeof PsychicSerializer }
export default class PsychicDir {
  public static async models() {
    if (_models) return _models
    return await this.loadModels()
  }

  public static async loadModels() {
    _models = (await import(filePath('../.dream/sync/models'))).default as {
      [key: string]: DreamModel<any, any>
    }
    return _models
  }

  public static async controllers() {
    if (_controllers) return _controllers
    return await this.loadControllers()
  }

  public static async loadControllers() {
    _controllers = {}
    const controllerPaths = (await getFiles(await filePath('app/controllers'))).filter(path =>
      /\.ts$/.test(path)
    )
    for (const controllerPath of controllerPaths) {
      const ControllerClass = (await import(controllerPath)).default as typeof PsychicController
      const controllerKey = controllerPath.replace(/^.*app\/controllers\//, '').replace(/\.ts$/, '')
      _controllers[controllerKey] = ControllerClass
    }
    return _controllers
  }

  public static async serializers() {
    if (_serializers) return _serializers
    return await this.loadSerializers()
  }

  public static async loadSerializers() {
    _serializers = (await import(filePath('.psy/serializers'))).default as {
      [key: string]: typeof PsychicSerializer
    }
    return _serializers
  }
}

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    (dirents as any[]).map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}
