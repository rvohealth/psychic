import { hyphenize } from '@rvoh/dream'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import psychicPath from '../../../helpers/path/psychicPath.js'

export default async function generateInitializer(
  openapiFilepath: string,
  outfile: string,
  initializerFilename: string,
) {
  if (!/\.d\.ts$/.test(outfile)) throw new Error(`outfile must have extension .d.ts`)

  const initializerFilenameWithoutExtension = initializerFilename.replace(/\.ts$/, '')
  const hyphenized = hyphenize(initializerFilenameWithoutExtension)

  const destDir = path.join(psychicPath('conf'), 'initializers')
  const initializerPath = path.join(destDir, `${initializerFilenameWithoutExtension}.ts`)

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir, { recursive: true })
  }

  const contents = `\
import { DreamCLI } from '@rvoh/dream'
import { PsychicApp } from "@rvoh/psychic"
import AppEnv from '../AppEnv.js'

export default (psy: PsychicApp) => {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      DreamCLI.logger.logStartProgress(\`[${hyphenized}] extracting types from ${openapiFilepath} to ${outfile}...\`)
      await DreamCLI.spawn('npx openapi-typescript ${openapiFilepath} -o ${outfile}')
      DreamCLI.logger.logEndProgress()
    }
  })
}\
`

  await fs.writeFile(initializerPath, contents)
}
