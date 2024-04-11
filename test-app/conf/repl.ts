import '../../src/helpers/loadEnv'
import * as repl from 'node:repl'
import * as fs from 'fs/promises'
import * as path from 'path'
import { DateTime } from 'luxon'
import { Dream } from '@rvohealth/dream'

const replServer = repl.start('> ')
export default (async function () {
  replServer.context.DateTime = DateTime
  const dreamPaths = await getFiles('./test-app/app/models')

  for (const dreamPath of dreamPaths) {
    const importablePath = dreamPath.replace(/.*\/test-app/, '..')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const dreamClass = (await import(importablePath)).default as typeof Dream
    if (dreamClass.isDream)
      replServer.context[
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        await dreamClass.globalName()
      ] = dreamClass
  }
})()

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    }),
  )
  return Array.prototype.concat(...files) as string[]
}
