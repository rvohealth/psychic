import { Dream } from '@rvohealth/dream'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

export default async function loadModels() {
  const modelsPath = join(finalDirname, '..', '..', 'app', 'models')
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  const modelClasses: [string, typeof Dream][] = []

  for (const modelPath of modelPaths) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    modelClasses.push([modelPath, (await import(modelPath)).default as typeof Dream])
  }

  return modelClasses
}
