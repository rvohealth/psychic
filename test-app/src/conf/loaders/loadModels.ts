import { Dream } from '@rvohealth/dream'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import getFiles from './getFiles'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function loadModels() {
  const modelsPath = join(__dirname, '..', '..', 'app', 'models')
  const modelPaths = (await getFiles(modelsPath)).filter(path => /\.[jt]s$/.test(path))

  const modelClasses: [string, typeof Dream][] = []

  for (const modelPath of modelPaths) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    modelClasses.push([modelPath, (await import(modelPath)).default as typeof Dream])
  }

  return modelClasses
}
