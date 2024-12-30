import './src/conf/global'

import PsychicServer from '../src/server'
import initializePsychicApplication from './src/cli/helpers/initializePsychicApplication'

process.env.NODE_ENV = 'test'

async function start() {
  await initializePsychicApplication()

  const server = new PsychicServer()
  await server.start(parseInt(process.env.DEV_SERVER_PORT || '7778'))
}

void start()
