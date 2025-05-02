import { camelize } from '@rvoh/dream'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import psychicPath from '../../../helpers/path/psychicPath.js'

export default async function writeOpenapiJsonFile({
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
}) {
  const destFilename = `${camelize(exportName)}.openapi-codegen.json`
  const destDir = path.join(psychicPath('conf'), 'openapi')
  const destPath = path.join(destDir, destFilename)

  const jsonData = {
    schemaFile: path.join('..', '..', '..', schemaFile),
    apiFile: path.join('..', '..', '..', apiFile),
    outputFile: path.join('..', '..', '..', outputFile),
    apiImport,
    exportName,
  }

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir)
  }

  await fs.writeFile(destPath, JSON.stringify(jsonData, null, 2))
}
