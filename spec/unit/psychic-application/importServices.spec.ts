import path from 'node:path'
import { getCachedPsychicApp } from '../../../src/psychic-app/cache.js'
import importServices, {
  getServicesOrBlank,
  getServicesOrFail,
  setCachedServices,
} from '../../../src/psychic-app/helpers/import/importServices.js'
import PsychicImporter from '../../../src/psychic-app/helpers/PsychicImporter.js'
import PsychicApp from '../../../src/psychic-app/index.js'
import importDefault from '../../../test-app/src/app/helpers/importDefault.js'

const servicesPath = path.resolve('test-app/src/app/services')

function deferred() {
  let resolve!: () => void
  let reject!: (reason: Error) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('importServices', () => {
  let originalServices: ReturnType<typeof getServicesOrFail>
  let originalApp: ReturnType<typeof getCachedPsychicApp>

  beforeEach(() => {
    originalServices = getServicesOrFail()
    originalApp = getCachedPsychicApp()
    setCachedServices(undefined!)
  })

  afterEach(() => {
    setCachedServices(originalServices)
    vi.restoreAllMocks()
    expect(getCachedPsychicApp()).toBe(originalApp)
  })

  describe('service cache behavior', () => {
    it('keeps nested names, helpers without setters, undefined exports and successful cache reuse', async () => {
      const services = await importServices(servicesPath, importDefault)
      expect(services).toHaveProperty('services/GlobalNameCompatibleClass')
      expect(services).toHaveProperty('services/Nested/GlobalNameCompatibleClass')
      expect(services).toHaveProperty('services/NoGlobalNameClass')
      expect(services).toHaveProperty('services/NoDefaultExportClass', undefined)
      expect(services).toHaveProperty('services/functions/noDefaultExportFunction', undefined)
      expect(services).toHaveProperty('services/functions/globalNameIncompatibleFunction')
      expect(Object.keys(services)).toHaveLength(6)
      expect(getServicesOrFail()).toBe(services)
      expect(getServicesOrBlank()).toBe(services)

      const unusedImport = vi.fn(() => Promise.reject(new Error('must use successful cache')))
      expect(await importServices('another/path', unusedImport)).toBe(services)
      expect(unusedImport).not.toHaveBeenCalled()
    })

    it('reuses a successfully loaded empty registry', async () => {
      const discovery = vi.spyOn(PsychicImporter, 'importServices').mockResolvedValue([])
      const importCb = vi.fn(() => Promise.resolve(undefined))
      const services = await importServices(servicesPath, importCb)
      expect(services).toEqual({})
      expect(await importServices('another/path', importCb)).toBe(services)
      expect(getServicesOrFail()).toBe(services)
      expect(discovery).toHaveBeenCalledTimes(1)
      expect(importCb).not.toHaveBeenCalled()
    })
  })

  it('keeps overlapping callers and app loads pending until the complete registry is available', async () => {
    const entered = deferred()
    const release = deferred()
    class Service {}
    const importCb = vi.fn(async () => {
      entered.resolve()
      await release.promise
      return Service
    })
    const first = importServices(servicesPath, importCb)
    const attempts: Promise<unknown>[] = [first]

    try {
      await entered.promise
      const overlaps = Array.from({ length: 7 }, () => importServices(servicesPath, importCb))
      const apps = [new PsychicApp(), new PsychicApp()]
      const unusedImport = vi.fn(() => Promise.resolve(undefined))
      const loads = apps.map(app => app.load('services', servicesPath, unusedImport))
      attempts.push(...overlaps, ...loads)
      const completed = vi.fn()
      for (const attempt of attempts) void attempt.then(completed)
      await Promise.resolve()
      await Promise.resolve()

      expect(completed).not.toHaveBeenCalled()
      expect(apps.map(app => app.loadedServices)).toEqual([false, false])
      expect(() => getServicesOrFail()).toThrow('Must call loadServices')
      expect(getServicesOrBlank()).toEqual({})

      release.resolve()
      const services = await first
      expect(Object.keys(services)).toHaveLength(6)
      expect(Object.values(services)).toEqual(Array.from({ length: 6 }, () => Service))
      for (const result of await Promise.all(overlaps)) expect(result).toBe(services)
      await Promise.all(loads)
      expect(apps.map(app => app.loadedServices)).toEqual([true, true])
      for (const app of apps) expect(app.services).toBe(services)
      expect(importCb).toHaveBeenCalledTimes(6)
      expect(unusedImport).not.toHaveBeenCalled()
    } finally {
      release.resolve()
      await Promise.allSettled(attempts)
    }
  })

  it('rejects every overlapping caller with the original import error and permits a later retry', async () => {
    const entered = deferred()
    const release = deferred()
    const originalError = new Error('service import failed')
    const importCb = vi.fn(async () => {
      entered.resolve()
      await release.promise
    })
    const first = importServices(servicesPath, importCb)
    const attempts: Promise<unknown>[] = [first]
    // Attach rejection observers before releasing the callback barrier.
    const outcomes: Promise<PromiseSettledResult<unknown>[]>[] = [Promise.allSettled([first])]

    try {
      await entered.promise
      const apps = [new PsychicApp(), new PsychicApp()]
      const unusedImport = vi.fn(() => Promise.resolve(undefined))
      const overlaps = Array.from({ length: 7 }, () => importServices(servicesPath, unusedImport))
      const loads = apps.map(app => app.load('services', servicesPath, unusedImport))
      attempts.push(...overlaps, ...loads)
      outcomes.push(Promise.allSettled([...overlaps, ...loads]))
      release.reject(originalError)

      const results = (await Promise.all(outcomes)).flat()
      expect(results).toHaveLength(10)
      for (const result of results) {
        expect(result.status).toBe('rejected')
        if (result.status === 'rejected') expect(result.reason).toBe(originalError)
      }
      expect(apps.map(app => app.loadedServices)).toEqual([false, false])
      expect(() => getServicesOrFail()).toThrow('Must call loadServices')
      expect(getServicesOrBlank()).toEqual({})
      expect(unusedImport).not.toHaveBeenCalled()
      expect(importCb).toHaveBeenCalledTimes(6)

      const services = await importServices(servicesPath, importDefault)
      expect(Object.keys(services)).toHaveLength(6)
      expect(getServicesOrFail()).toBe(services)
    } finally {
      release.resolve()
      await Promise.allSettled(attempts)
    }
  })

  it('publishes no partial registry when name registration fails and permits a later retry', async () => {
    const originalError = new Error('service registration failed')
    class RegisteredService {
      static setGlobalName = vi.fn()
    }
    class RejectedService {
      static setGlobalName() {
        throw originalError
      }
    }
    const discovery = vi.spyOn(PsychicImporter, 'importServices').mockResolvedValue([
      [`${servicesPath}/Registered.ts`, RegisteredService],
      [`${servicesPath}/Rejected.ts`, RejectedService],
    ])

    await expect(importServices(servicesPath, importDefault)).rejects.toBe(originalError)
    expect(RegisteredService.setGlobalName).toHaveBeenCalledWith('services/Registered')
    expect(() => getServicesOrFail()).toThrow('Must call loadServices')
    expect(getServicesOrBlank()).toEqual({})

    discovery.mockRestore()
    const services = await importServices(servicesPath, importDefault)
    expect(Object.keys(services)).toHaveLength(6)
    expect(getServicesOrFail()).toBe(services)
  })
})
