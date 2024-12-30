import './src/conf/global'

import PsychicServer from '../src/server'
import initializePsychicApplication from './src/cli/helpers/initializePsychicApplication'

async function start() {
  await initializePsychicApplication()

  const server = new PsychicServer()
  await server.start()
}

void start()
