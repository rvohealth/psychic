import globalServiceKeyFromPath from '../globalServiceKeyFromPath.js'
import PsychicImporter from '../PsychicImporter.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _services: Record<string, any>

export default async function importServices(
  servicesPath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceImportCb: (path: string) => Promise<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  if (_services) return _services

  _services = {}

  const serviceClasses = await PsychicImporter.importServices(servicesPath, serviceImportCb)

  for (const [servicePath, serviceClass] of serviceClasses) {
    const typedServiceClass = serviceClass as {
      background: () => void
      schedule: () => void
      setGlobalName: (str: string) => void
      globalName: string
    }

    const serviceKey = globalServiceKeyFromPath(servicePath, servicesPath)

    if (typeof typedServiceClass?.['setGlobalName'] === 'function') {
      typedServiceClass['setGlobalName'](serviceKey)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    _services[serviceKey] = serviceClass
  }

  return _services
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setCachedServices(services: Record<string, any>) {
  _services = services
}

export function getServicesOrFail() {
  if (!_services) throw new Error('Must call loadServices before calling getServicesOrFail')
  return _services
}

export function getServicesOrBlank() {
  return _services || {}
}
