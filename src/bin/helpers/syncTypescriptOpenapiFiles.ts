import { DreamCLI } from '@rvoh/dream'
import * as path from 'node:path'
import PsychicApp from '../../psychic-app/index.js'
import psychicPath from '../../helpers/path/psychicPath.js'

export default async function syncTypescriptOpenapiFiles() {
  const psychicApp = PsychicApp.getOrFail()
  await Promise.all(
    Object.keys(psychicApp.openapi).map(key => {
      const openapiOpts = psychicApp.openapi[key]!
      const jsonPath = openapiOpts.outputFilename
      const outpath = path.join(psychicPath('types'), `${jsonPath.replace(/\.json$/, '')}.d.ts`)

      return DreamCLI.spawn(`npx openapi-typescript ${jsonPath} -o ${outpath}`)
    }),
  )
}
