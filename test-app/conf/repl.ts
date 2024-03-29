import '../../src/helpers/loadEnv'
import repl from 'node:repl'
import fs from 'fs/promises'
import path from 'path'
import importFileWithDefault from '../../src/helpers/importFileWithDefault'
// import models from '../app/models'

const replServer = repl.start('> ')
export default (async function () {
  const dreamPaths = await getFiles('./test-app/app/models')
  for (const dreamPath of dreamPaths) {
    const importablePath = dreamPath.replace(/.*\/test-app/, '..')
    const DreamClass = await importFileWithDefault(importablePath)
    replServer.context[(DreamClass as any).name] = DreamClass
  }
})()

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    (dirents as any[]).map(dirent => {
      const res = path.resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}
