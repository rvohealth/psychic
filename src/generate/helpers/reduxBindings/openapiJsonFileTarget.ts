import { camelize } from '@rvoh/dream/utils'
import * as path from 'node:path'
import { FileWriteTarget } from '../../../cli/helpers/applyConfirmedWriteSet.js'
import psychicPath from '../../../helpers/path/psychicPath.js'

/**
 * Computes the @rtk-query/codegen-openapi config JSON write target. This file
 * holds the re-runnable settings (schemaFile/apiFile/outputFile/apiImport/exportName).
 */
export default function openapiJsonFileTarget({
  exportName,
  schemaFile,
  apiFile,
  apiImport,
  outputFile,
}: {
  exportName: string
  schemaFile: string
  apiFile: string
  apiImport: string
  outputFile: string
}): FileWriteTarget {
  const destFilename = `${camelize(exportName)}.openapi-codegen.json`
  const destDir = path.join(psychicPath('conf'), 'openapi')
  const filePath = path.join(destDir, destFilename)

  const jsonData = {
    schemaFile: path.join('..', '..', '..', replacePrefixingPathSegment(schemaFile)),
    apiFile: path.join('..', '..', '..', replacePrefixingPathSegment(apiFile)),
    outputFile: path.join('..', '..', '..', replacePrefixingPathSegment(outputFile)),
    apiImport,
    exportName,
    hooks: true,
  }

  return { filePath, contents: JSON.stringify(jsonData, null, 2) }
}

function replacePrefixingPathSegment(path: string) {
  return path.replace(/^\.[/\\]/, '')
}
