import { DreamSerializer } from '@rvohealth/dream'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import getFiles from './getFiles'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function loadSerializers() {
  const serializersPath = join(__dirname, '..', '..', 'app', 'serializers')
  const serializerPaths = (await getFiles(serializersPath)).filter(path => /\.[jt]s$/.test(path))

  const serializerClasses: [string, Record<string, typeof DreamSerializer>][] = []

  for (const serializerPath of serializerPaths) {
    serializerClasses.push([
      serializerPath,
      (await import(serializerPath)) as Record<string, typeof DreamSerializer>,
    ])
  }

  return serializerClasses
}
