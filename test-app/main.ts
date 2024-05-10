import './conf/global'
import PsychicServer from '../src/server'

async function start() {
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
