import * as fs from 'node:fs/promises'
import openapiJsonPath from '../helpers/openapiJsonPath.js'
import MustCallPsychicAppInitFirst from '../error/psychic-app/must-call-psychic-app-init-first.js'
const _openapiData: Record<string, OpenapiShell | typeof FILE_DOES_NOT_EXIST> = {}

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
  if (val === FILE_DOES_NOT_EXIST) return undefined
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

  // if the openapi file is not generated yet, we don't want to raise an
  // exception, so we will simply consider this file as undefined.
  try {
    const buffer = await fs.readFile(openapiJsonPath(openapiName))

    const openapiDoc = JSON.parse(buffer.toString()) as OpenapiShell

    //  we only cache the components from the openapi files,
    //  since that is all that we currently need for validation,
    //  which is the only thing leveraging these cached openapi files.
    _openapiData[openapiName] = openapiDoc?.components
      ? { components: openapiDoc.components }
      : FILE_DOES_NOT_EXIST
  } catch {
    _openapiData[openapiName] = FILE_DOES_NOT_EXIST
    // noop
  }
}

const FILE_DOES_NOT_EXIST = 'FILE_DOES_NOT_EXIST'
