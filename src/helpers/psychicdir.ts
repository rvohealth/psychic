import { Dream, DreamSerializer } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import PsychicController from '../controller'
import absoluteSrcPath from './absoluteSrcPath'
import importFileWithDefault from './importFileWithDefault'
import importFile from '@rvohealth/dream/src/helpers/path/importFile'
import { envBool } from './envValue'

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
      envBool('TS_SAFE') ? /\.ts$/.test(path) : /\.js$/.test(path),
    )

    for (const controllerPath of controllerPaths) {
      try {
        const ControllerClass = await importFileWithDefault<typeof PsychicController>(controllerPath)
        const controllerKey = controllerPath.replace(/^.*app\/controllers\//, '').replace(/\.[jt]s$/, '')
        _controllers[controllerKey] = ControllerClass
      } catch (err) {
        // Adding this console error, since controllers with type errors will just cause
        // this to fail silently otherwise, preventing the developer from understanding the root cause.
        console.error('An unknown error occurred while trying to import your controllers: ', err)
        throw err
      }
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const allSerializers = await importFile(serializerPath)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Object.keys(allSerializers).forEach(key => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const potentialSerializer = allSerializers[key]

        if ((potentialSerializer as typeof DreamSerializer)?.isDreamSerializer) {
          const serializerKey = makeSerializerKey(
            serializerPath,
            potentialSerializer as typeof DreamSerializer,
          )

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          _serializers[serializerKey] = potentialSerializer
        }
      })
    }
    return _serializers
  }
}

interface DirResult {
  name: string
  isDirectory: () => boolean
}

function makeSerializerKey(serializerPath: string, serializerClass: typeof DreamSerializer): string {
  const trimmedPath = serializerPath
    .replace(/^.*app\/serializers\//, '')
    .replace(/\.[jt]s$/, '')
    .replace(/Serializer$/, '')

  const pathMinusLastSegmentArr = trimmedPath.split('/')
  pathMinusLastSegmentArr.pop()
  const serializerPathMinusLastSegment = pathMinusLastSegmentArr.join('/')

  // default exports should just get the file name as the key,
  // where named exports should get their named consts
  const serializerKey = (
    serializerPathMinusLastSegment.replace(/^.*app\/serializers\//, '').replace(/\.[jt]s$/, '') +
    '/' +
    serializerClass.name.replace(/Serializer$/, '')
  ).replace(/^\//, '')

  return serializerKey
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
