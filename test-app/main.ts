import './src/conf/global.js'

import PsychicServer from '../src/server/index.js'
import initializePsychicApp from './src/cli/helpers/initializePsychicApp.js'

async function start() {
  await initializePsychicApp()

  const server = new PsychicServer()
  await server.start()
}

void start()
