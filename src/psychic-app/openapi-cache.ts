import * as fs from 'node:fs/promises'
import openapiJsonPath from '../helpers/openapiJsonPath.js'
import MustCallPsychicAppInitFirst from '../error/psychic-app/must-call-psychic-app-init-first.js'
import EnvInternal from '../helpers/EnvInternal.js'
import OpenapiFileNotFound from '../error/openapi/OpenapiFileNotFound.js'
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
export function getOpenapiFileOrFail(openapiName: string) {
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
export async function readAndCacheOpenapiFile(openapiName: string): Promise<void> {
  if (_openapiData[openapiName]) return

  const openapiPath = openapiJsonPath(openapiName)
  try {
    const buffer = await fs.readFile(openapiPath)

    const openapiDoc = JSON.parse(buffer.toString()) as OpenapiShell

    //  we only cache the components from the openapi files,
    //  since that is all that we currently need for validation,
    //  which is the only thing leveraging these cached openapi files.
    _openapiData[openapiName] = openapiDoc?.components
      ? { components: openapiDoc.components }
      : FILE_DOES_NOT_EXIST
  } catch {
    if (EnvInternal.isProduction) {
      throw new OpenapiFileNotFound(openapiName, openapiPath)
    }

    // if the openapi file is not generated yet and we are in our local
    // environment, we don't want to raise an exception, since it could
    // prevent someone from ever defining a new openapi configuration.
    _openapiData[openapiName] = FILE_DOES_NOT_EXIST
  }
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
export function ignoreOpenapiFile(openapiName: string): void {
  _openapiData[openapiName] = FILE_WAS_IGNORED
}

const FILE_DOES_NOT_EXIST = 'FILE_DOES_NOT_EXIST'
const FILE_WAS_IGNORED = 'FILE_WAS_IGNORED'
