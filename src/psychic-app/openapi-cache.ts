import MustCallPsychicAppInitFirst from '../error/psychic-app/must-call-psychic-app-init-first.js'
import OpenapiAppRenderer from '../openapi-renderer/app.js'
import { RouteConfig } from '../router/route-manager.js'
const _openapiData: Record<string, OpenapiShell | typeof FILE_DOES_NOT_EXIST | typeof FILE_WAS_IGNORED> = {}

/**
 * we only cache the components from the openapi files,
 * since that is all that we currently need for validation,
 * which is the only thing leveraging these cached openapi files.
 */
export interface OpenapiShell {
  components: {
    schemas: object
  }
}

/**
 * Raises an exception if readAndCacheOpenapiFile was not called
 * first, since this is a requisite to returning the scanned file.
 *
 * @param openapiName - the openapiName you wish to look up
 * @returns the cached openapi file, or undefined if it was not found
 */
export function getCachedOpenapiDocOrFail(openapiName: string) {
  const val = _openapiData[openapiName]
  if (!val) throw new MustCallPsychicAppInitFirst()
  if (val === FILE_DOES_NOT_EXIST || val === FILE_WAS_IGNORED) return undefined
  return val
}

/**
 * Reads the openapi file corresponding to the openapiName,
 * and caches its contents, enabling them to be read back
 * at a later time, such as during endpoint validation.
 *
 * This function is called during PsychicApp.init sequence automatically.
 *
 * @param openapiName - the openapiName you wish to look up
 */
export function cacheOpenapiDoc(openapiName: string, routes: RouteConfig[]): void {
  if (_openapiData[openapiName]) return

  const openapiDoc = OpenapiAppRenderer._toObject(routes, openapiName, { bypassMissingRoutes: true })
  _openapiData[openapiName] = openapiDoc?.components
    ? ({ components: openapiDoc.components } as OpenapiShell)
    : FILE_DOES_NOT_EXIST
}

/**
 * Reads the openapi file corresponding to the openapiName,
 * and caches its contents, enabling them to be read back
 * at a later time, such as during endpoint validation.
 *
 * This function is called during PsychicApp.init sequence automatically.
 *
 * @param openapiName - the openapiName you wish to look up
 */
export function ignoreOpenapiDoc(openapiName: string): void {
  _openapiData[openapiName] = FILE_WAS_IGNORED
}

export function _testOnlyClearOpenapiCache(openapiName: string) {
  _openapiData[openapiName] = undefined as unknown as typeof FILE_WAS_IGNORED
}

const FILE_DOES_NOT_EXIST = 'FILE_DOES_NOT_EXIST'
const FILE_WAS_IGNORED = 'FILE_WAS_IGNORED'
