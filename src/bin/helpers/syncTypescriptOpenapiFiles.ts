import { camelize, capitalize, DreamCLI } from '@rvoh/dream'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import PsychicApp from '../../psychic-app/index.js'
import psychicPath from '../../helpers/path/psychicPath.js'

export default async function syncTypescriptOpenapiFiles() {
  const psychicApp = PsychicApp.getOrFail()
  const syncableKeys = Object.keys(psychicApp.openapi).filter(key => psychicApp.openapi[key]?.syncTypes)
  await Promise.all(
    syncableKeys.map(key => {
      const openapiOpts = psychicApp.openapi[key]!
      const jsonPath = openapiOpts.outputFilename
      const outpath = path.join(psychicPath('types'), `${jsonPath.replace(/\.json$/, '')}.d.ts`)

      return DreamCLI.spawn(`npx openapi-typescript ${jsonPath} -o ${outpath}`).then(async () => {
        const file = (await fs.readFile(outpath)).toString()
        const exportName =
          dotToCamelCase(
            camelize(
              jsonPath
                .split('/')
                .at(-1)
                ?.replace(/\.json/, ''),
            )!,
          ) + 'Paths'

        await fs.writeFile(outpath, file.replace(/export interface paths/, `export interface ${exportName}`))
      })
    }),
  )
}

function dotToCamelCase(inputString: string) {
  return inputString
    .split('.')
    .map((word, index) => (index === 0 ? word : capitalize(word)))
    .join('')
}
