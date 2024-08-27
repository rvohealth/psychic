import './conf/global'

import { PsychicServer } from '@rvohealth/psychic'
import initializePsychicApplication from './cli/helpers/initializePsychicApplication'

process.env.NODE_ENV = 'test'

async function start() {
  await initializePsychicApplication()

  const server = new PsychicServer()
  await server.start(parseInt(process.env.SPEC_SERVER_PORT || '7778'))

  process.on('SIGINT', () => {
    server
      .stop()
      .then(() => {})
      .catch(() => {})
  })
}

void start()
