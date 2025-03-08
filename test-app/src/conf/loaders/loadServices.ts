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

export default async function loadServices() {
  const servicesPath = join(finalDirname, '..', '..', 'services')
  const servicePaths = (await getFiles(servicesPath)).filter(path => /\.[jt]s$/.test(path))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceClasses: [string, any][] = []

  for (const servicePath of servicePaths) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    serviceClasses.push([servicePath, (await import(servicePath)).default])
  }

  return serviceClasses
}
