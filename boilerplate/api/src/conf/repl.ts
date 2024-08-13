import './loadEnv'
import * as repl from 'node:repl'
import { loadRepl } from '@rvohealth/dream'

const replServer = repl.start('> ')
export default (async function () {
  await loadRepl(replServer.context)
})()
