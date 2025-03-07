import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PsychicController } from '../../../../src'
import getFiles from './getFiles'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function loadControllers() {
  const controllersPath = join(__dirname, '..', '..', 'app', 'controllers')
  const controllerPaths = (await getFiles(controllersPath)).filter(path => /\.[jt]s$/.test(path))

  const controllerClasses: [string, typeof PsychicController][] = []

  for (const controllerPath of controllerPaths) {
    controllerClasses.push([
      controllerPath,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (await import(controllerPath)).default as typeof PsychicController,
    ])
  }

  return controllerClasses
}
