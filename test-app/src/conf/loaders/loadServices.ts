import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import getFiles from './getFiles'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function loadServices() {
  const servicesPath = join(__dirname, '..', '..', 'services')
  const servicePaths = (await getFiles(servicesPath)).filter(path => /\.[jt]s$/.test(path))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceClasses: [string, any][] = []

  for (const servicePath of servicePaths) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    serviceClasses.push([servicePath, (await import(servicePath)).default])
  }

  return serviceClasses
}
