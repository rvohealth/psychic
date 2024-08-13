import fs from 'fs/promises'
import path from 'path'
import PsychicController from '../../controller'
import globalControllerKeyFromPath from './globalControllerKeyFromPath'

let _controllers: Record<string, typeof PsychicController>

export default async function loadControllers(
  controllersPath: string,
): Promise<Record<string, typeof PsychicController>> {
  if (_controllers) return _controllers

  _controllers = {}
  const controllerPaths = (await getFiles(controllersPath)).filter(path => /\.[jt]s$/.test(path))

  for (const controllerPath of controllerPaths) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const potentialControllerClass = (await import(controllerPath)).default

    if ((potentialControllerClass as typeof PsychicController)?.isPsychicController) {
      const controllerClass = potentialControllerClass as typeof PsychicController
      const controllerKey = globalControllerKeyFromPath(controllerPath, controllersPath)

      controllerClass['setGlobalName'](controllerKey)

      _controllers[controllerKey] = controllerClass
    }
  }

  return _controllers
}

export function getControllersOrFail() {
  if (!_controllers) throw new Error('Must call loadModels before calling getModelsOrFail')
  return _controllers
}

export function getControllersOrBlank() {
  return _controllers || {}
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

interface DirResult {
  name: string
  isDirectory: () => boolean
}
