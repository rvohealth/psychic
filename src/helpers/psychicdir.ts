import { Dream, DreamSerializer } from 'dream'
import fs from 'fs/promises'
import path from 'path'
import PsychicController from '../controller'
import absoluteSrcPath from './absoluteSrcPath'
import importFileWithDefault from './importFileWithDefault'

let _models: { [key: string]: typeof Dream }
let _controllers: { [key: string]: typeof PsychicController }
let _serializers: { [key: string]: typeof DreamSerializer }
export default class PsychicDir {
  public static async models() {
    if (_models) return _models
    return await this.loadModels()
  }

  public static async loadModels() {
    _models = {}
    const modelPaths = (await getFiles(await absoluteSrcPath('app/models'))).filter(path =>
      /\.ts$/.test(path)
    )
    for (const modelPath of modelPaths) {
      const ModelClass = (await importFileWithDefault(modelPath)) as typeof Dream
      const modelKey = modelPath.replace(/^.*app\/models\//, '').replace(/\.ts$/, '')
      _models[modelKey] = ModelClass
    }
    return _models
  }

  public static async controllers() {
    if (_controllers) return _controllers
    return await this.loadControllers()
  }

  public static async loadControllers() {
    _controllers = {}
    const controllerPaths = (await getFiles(absoluteSrcPath('app/controllers'))).filter(path =>
      /\.ts$/.test(path)
    )
    for (const controllerPath of controllerPaths) {
      const ControllerClass = (await importFileWithDefault(controllerPath)) as typeof PsychicController
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
    _serializers = {}
    const serializerPaths = (await getFiles(absoluteSrcPath('app/serializers'))).filter(path =>
      /\.ts$/.test(path)
    )
    for (const serializerPath of serializerPaths) {
      const serializerClass = (await importFileWithDefault(serializerPath)) as typeof DreamSerializer
      const serializerKey = serializerPath.replace(/^.*app\/serializers\//, '').replace(/\.ts$/, '')
      _serializers[serializerKey] = serializerClass
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
