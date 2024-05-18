import './loadEnv'
import * as repl from 'node:repl'
import { loadRepl } from '@rvohealth/psychic'

const replServer = repl.start('> ')
export default (async function () {
  await loadRepl(replServer.context)
})()
