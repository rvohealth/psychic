import './src/conf/global.js'

import PsychicServer from '../src/server/index.js'
import initializePsychicApplication from './src/cli/helpers/initializePsychicApplication.js'

async function start() {
  await initializePsychicApplication()

  const server = new PsychicServer()
  await server.start()
}

void start()
