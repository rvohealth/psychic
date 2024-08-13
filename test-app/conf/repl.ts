import '../../src/helpers/loadEnv'

import { loadRepl } from '@rvohealth/dream'
import * as repl from 'node:repl'

const replServer = repl.start('> ')
export default (async function () {
  await loadRepl(replServer.context)
})()
