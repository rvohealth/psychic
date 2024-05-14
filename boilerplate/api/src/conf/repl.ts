import './loadEnv'
import * as repl from 'node:repl'
import * as fs from 'fs/promises'
import * as path from 'path'
import { DateTime } from 'luxon'
import { Dream } from '@rvohealth/dream'

const replServer = repl.start('> ')
export default (async function () {
  replServer.context.DateTime = DateTime
  const dreamPaths = (await getFiles('./src/app/models')).filter(file => /\.ts$/.test(file))

  for (const dreamPath of dreamPaths) {
    const importablePath = dreamPath.replace(/.*\/src/, '..')
    // eslint-disable-next-line
    const dreamClass = (await import(importablePath)).default as typeof Dream
    if (dreamClass.isDream)
      replServer.context[
        // eslint-disable-next-line
        await dreamClass.globalName()
      ] = dreamClass
  }

  const servicePaths = (await getFiles('./src/app/services')).filter(file => /\.ts$/.test(file))
  for (const servicePath of servicePaths) {
    const importablePath = servicePath.replace(/.*\/src/, '..')
    // eslint-disable-next-line
    const serviceExport = (await import(importablePath)).default as typeof Dream
    if (serviceExport) replServer.context[serviceExport.name] = serviceExport
  }
})()

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files) as string[]
}
