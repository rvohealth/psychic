import '../../../src/helpers/loadEnv.js'

import { loadRepl } from '@rvoh/dream/internal'
import { Encrypt } from '@rvoh/dream/utils'
import * as repl from 'node:repl'
import initializePsychicApp from '../cli/helpers/initializePsychicApp.js'

const replServer = repl.start('> ')
export default (async function () {
  await initializePsychicApp()
  await loadRepl(replServer.context)

  replServer.context.Encrypt = Encrypt
})()
