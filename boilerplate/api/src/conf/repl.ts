import './loadEnv'
import * as repl from 'node:repl'
import { loadRepl } from '@rvohealth/dream'
import initializePsychicApplication from '../cli/helpers/initializePsychicApplication'

const replServer = repl.start('> ')
export default (async function () {
  await initializePsychicApplication()
  loadRepl(replServer.context)
})()
