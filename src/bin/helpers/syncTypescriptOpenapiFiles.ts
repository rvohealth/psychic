import { DreamCLI } from '@rvoh/dream'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import psychicPath from '../../helpers/path/psychicPath.js'
import PsychicApp from '../../psychic-app/index.js'

export default async function syncTypescriptOpenapiFiles() {
  const psychicApp = PsychicApp.getOrFail()
  const syncableKeys = Object.keys(psychicApp.openapi).filter(key => psychicApp.openapi[key]?.syncTypes)

  const targetDir = path.join(psychicPath('types'), 'openapi')
  await fs.mkdir(targetDir, { recursive: true })

  await Promise.all(
    syncableKeys.map(key => {
      const openapiOpts = psychicApp.openapi[key]!
      const jsonPath = openapiOpts.outputFilepath
      const outpath = path.join(targetDir, path.basename(jsonPath).replace(/\.json$/, '.d.ts'))

      return DreamCLI.spawn(`npx openapi-typescript ${jsonPath} -o ${outpath}`)
    }),
  )
}
