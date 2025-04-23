import '../../../src/helpers/loadEnv.js'

import { Encrypt, loadRepl } from '@rvoh/dream'
import * as repl from 'node:repl'
import initializePsychicApp from '../cli/helpers/initializePsychicApp.js'

const replServer = repl.start('> ')
export default (async function () {
  await initializePsychicApp()
  await loadRepl(replServer.context)

  replServer.context.Encrypt = Encrypt
})()
