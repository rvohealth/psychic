// import '../../src/helpers/loadEnv'
// import * as repl from 'node:repl'

// const replServer = repl.start('> ')
// export default (async function () {
//   const models = (await import('../../.dream/sync/models')).default
//   Object.values(models).forEach(ModelClass => {
//     replServer.context[(ModelClass as any).name] = ModelClass
//   })
// })()

import '../../src/helpers/loadEnv'
import * as repl from 'node:repl'
import * as fs from 'fs/promises'
import * as path from 'path'
// import * as models from '../app/models'

const replServer = repl.start('> ')
export default (async function () {
  const dreamPaths = await getFiles('./test-app/app/models')
  for (const dreamPath of dreamPaths) {
    const importablePath = dreamPath.replace(/.*\/test-app/, '..')
    const DreamClass = (await import(importablePath)).default
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
