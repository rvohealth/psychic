import { Dream, DreamSerializer } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import PsychicController from '../controller'
import absoluteSrcPath from './absoluteSrcPath'
import importFileWithDefault from './importFileWithDefault'
import PsychicWsController from '../cable/ws-controller'

let _models: { [key: string]: typeof Dream }
let _controllers: { [key: string]: typeof PsychicController }
let _serializers: { [key: string]: typeof DreamSerializer }
let _wsControllers: { [key: string]: typeof PsychicWsController }
export default class PsychicDir {
  public static async models() {
    if (_models) return _models
    return await this.loadModels()
  }

  public static async loadModels() {
    _models = {}
    const modelPaths = (await getFiles(absoluteSrcPath('app/models'))).filter(path => /\.[jt]s$/.test(path))
    for (const modelPath of modelPaths) {
      const ModelClass = await importFileWithDefault<typeof Dream>(modelPath)
      const modelKey = modelPath.replace(/^.*app\/models\//, '').replace(/\.[jt]s$/, '')
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
      process.env.TS_SAFE === '1' ? /\.ts$/.test(path) : /\.js$/.test(path),
    )
    for (const controllerPath of controllerPaths) {
      const ControllerClass = await importFileWithDefault<typeof PsychicController>(controllerPath)
      const controllerKey = controllerPath.replace(/^.*app\/controllers\//, '').replace(/\.[jt]s$/, '')
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
      /\.[jt]s$/.test(path),
    )
    for (const serializerPath of serializerPaths) {
      const serializerClass = await importFileWithDefault<typeof DreamSerializer>(serializerPath)
      const serializerKey = serializerPath.replace(/^.*app\/serializers\//, '').replace(/\.[jt]s$/, '')
      _serializers[serializerKey] = serializerClass
    }
    return _serializers
  }

  public static async wsControllers() {
    if (_wsControllers) return _wsControllers
    return await this.loadWsControllers()
  }

  public static async loadWsControllers() {
    _wsControllers = {}
    const listenerPaths = (await getFiles(absoluteSrcPath('app/controllers/ws'))).filter(path =>
      process.env.TS_SAFE === '1' ? /\.ts$/.test(path) : /\.js$/.test(path),
    )

    for (const listenerPath of listenerPaths) {
      const wsControllerClass = await importFileWithDefault<typeof PsychicWsController>(listenerPath)
      const wsControllerKey = listenerPath.replace(/^.*app\/controllers\/ws\//, '').replace(/\.[jt]s$/, '')
      _wsControllers[wsControllerKey] = wsControllerClass
    }
    return _wsControllers
  }
}

interface DirResult {
  name: string
  isDirectory: () => boolean
}

async function getFiles(dir: string): Promise<string[]> {
  const dirents: DirResult[] = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    }),
  )
  return Array.prototype.concat(...files) as string[]
}
