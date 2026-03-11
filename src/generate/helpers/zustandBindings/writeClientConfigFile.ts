import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export default async function writeClientConfigFile({
  clientConfigFile,
}: {
  clientConfigFile: string
}) {
  const destDir = path.dirname(clientConfigFile)

  try {
    await fs.access(clientConfigFile)
    return // early return if the file already exists
  } catch {
    // noop
  }

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir, { recursive: true })
  }

  const contents = `\
import { client } from '@hey-api/client-fetch'

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

client.setConfig({
  baseUrl: baseUrl(),
  credentials: 'include',

  // you can customize headers here, for example to add auth tokens:
  // headers: {
  //   Authorization: \`Bearer \${getToken()}\`,
  // },
})`

  await fs.writeFile(clientConfigFile, contents)
}
