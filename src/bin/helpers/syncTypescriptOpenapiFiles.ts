import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import openapiTS, { astToString, NULL, NUMBER, STRING } from 'openapi-typescript'
import ts from 'typescript'
import psychicPath from '../../helpers/path/psychicPath.js'
import PsychicApp from '../../psychic-app/index.js'

export default async function syncTypescriptOpenapiFiles() {
  const psychicApp = PsychicApp.getOrFail()
  const syncableKeys = Object.keys(psychicApp.openapi).filter(key => psychicApp.openapi[key]?.syncTypes)

  const targetDir = path.join(psychicPath('types'), 'openapi')
  await fs.mkdir(targetDir, { recursive: true })

  await Promise.all(
    syncableKeys.map(async key => {
      const openapiOpts = psychicApp.openapi[key]!
      const jsonPath = openapiOpts.outputFilepath
      const outpath = path.join(targetDir, path.basename(jsonPath).replace(/\.json$/, '.d.ts'))
      const contents = (await fs.readFile(jsonPath)).toString()
      const data = await openapiTS(contents, {
        transform(schemaObject) {
          if (schemaObject.format === 'bigint') {
            const isNullable =
              schemaObject.nullable ||
              (Array.isArray(schemaObject.type) && schemaObject.type.includes('null'))

            return isNullable
              ? ts.factory.createUnionTypeNode([STRING, NUMBER, NULL])
              : ts.factory.createUnionTypeNode([STRING, NUMBER])
          }
        },
      })
      await fs.writeFile(outpath, astToString(data))
    }),
  )
}
