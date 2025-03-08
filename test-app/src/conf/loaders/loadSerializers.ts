import { DreamSerializer } from '@rvohealth/dream'
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

export default async function loadSerializers() {
  const serializersPath = join(finalDirname, '..', '..', 'app', 'serializers')
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
