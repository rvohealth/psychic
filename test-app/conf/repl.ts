import '../../src/helpers/loadEnv'
import * as repl from 'node:repl'

const replServer = repl.start('> ')
export default (async function () {
  const models = (await import('../../.dream/sync/models')).default
  Object.values(models).forEach(ModelClass => {
    replServer.context[(ModelClass as any).name] = ModelClass
  })
})()
