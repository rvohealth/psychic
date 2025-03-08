import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PsychicController } from '../../../../src'
import getFiles from './getFiles'

declare const importMeta: unique symbol
let finalDirname: string

if (typeof importMeta !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const __filename = fileURLToPath(import.meta.url)
  finalDirname = dirname(__filename)
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    finalDirname = __dirname
  } catch {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const __filename = fileURLToPath(import.meta.url)
    finalDirname = dirname(__filename)
  }
}

export default async function loadControllers() {
  const controllersPath = join(finalDirname, '..', '..', 'app', 'controllers')
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
