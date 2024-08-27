import './conf/global'

import { PsychicServer } from '@rvohealth/psychic'
import initializePsychicApplication from './cli/helpers/initializePsychicApplication'

async function start() {
  await initializePsychicApplication()

  const server = new PsychicServer()
  await server.start()

  process.on('SIGINT', () => {
    server
      .stop()
      .then(() => {})
      .catch(() => {})
  })
}

void start()
