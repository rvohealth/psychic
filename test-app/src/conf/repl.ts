import '../../../src/helpers/loadEnv.js'

import { Encrypt, loadRepl } from '@rvoh/dream'
import * as repl from 'node:repl'
import initializePsychicApplication from '../cli/helpers/initializePsychicApplication.js'

const replServer = repl.start('> ')
export default (async function () {
  await initializePsychicApplication()
  loadRepl(replServer.context)

  replServer.context.Encrypt = Encrypt
})()
