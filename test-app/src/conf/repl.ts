import '../../../src/helpers/loadEnv'

import { loadRepl } from '@rvohealth/dream'
import * as repl from 'node:repl'
import initializePsychicApplication from '../cli/helpers/initializePsychicApplication'

const replServer = repl.start('> ')
export default (async function () {
  await initializePsychicApplication()
  loadRepl(replServer.context)
})()
