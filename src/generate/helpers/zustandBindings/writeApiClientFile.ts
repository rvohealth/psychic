import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { camelize } from '@rvoh/dream/utils'

export default async function writeApiClientFile({
  exportName,
  outputDir,
  typesFile,
}: {
  exportName: string
  outputDir: string
  typesFile: string
}) {
  const destDir = outputDir
  const destPath = path.join(destDir, `${camelize(exportName)}.ts`)

  try {
    await fs.access(destPath)
    return // early return if the file already exists
  } catch {
    // noop
  }

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir, { recursive: true })
  }

  // compute the relative import path from the output file to the types file
  const typesRelative = path.relative(destDir, typesFile).replace(/\.d\.ts$/, '.js')
  const typesImportPath = typesRelative.startsWith('.') ? typesRelative : `./${typesRelative}`

  const contents = `\
import createClient from 'openapi-fetch'
import type { paths } from '${typesImportPath}'

function baseUrl() {
  // add custom code here for determining your application's baseUrl
  // this would generally be something different, depending on if you
  // are in dev/test/production environments. For dev, you might want
  // http://localhost:7777, while test may be http://localhost:7778, or
  // some other port, depending on how you have your spec hooks configured.
  // for production, it should be the real host for your application, i.e.
  // https://myapi.com

  return 'http://localhost:7777'
}

export const ${exportName} = createClient<paths>({
  baseUrl: baseUrl(),
  credentials: 'include',

  // you may customize headers here, for example to add auth tokens:
  // headers: {
  //   Authorization: \`Bearer \${getAuthToken()}\`,
  // },
})
`

  await fs.writeFile(destPath, contents)
}
