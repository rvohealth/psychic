import { PsychicAppInitializerCb } from '../../types.js'
import PsychicImporter from '../PsychicImporter.js'

let _initializers: Record<string, PsychicAppInitializerCb>

export default async function importInitializers(
  initializersPath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializerImportCb: (path: string) => Promise<any>,
): Promise<Record<string, PsychicAppInitializerCb>> {
  if (_initializers) return _initializers

  const initializerCbs = await PsychicImporter.importInitializers(initializersPath, initializerImportCb)

  _initializers = {}

  initializerCbs.forEach(([initializerPath, initializerCb]) => {
    _initializers[initializerPath] = initializerCb
  })

  return _initializers
}

export function setCachedInitializers(initializerCbs: Record<string, PsychicAppInitializerCb>) {
  _initializers = initializerCbs
}

export function getInitializersOrFail() {
  if (!_initializers)
    throw new Error("Must call PsychicApp.load('initializers', ...) before calling getInitializersOrFail")
  return _initializers
}

export function getInitializersOrBlank() {
  return _initializers || {}
}
