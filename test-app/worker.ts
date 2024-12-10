import { closeAllDbConnections } from '@rvohealth/dream'
import { background, stopBackgroundWorkers } from '../src'
import initializePsychicApplication from './src/cli/helpers/initializePsychicApplication'
import './src/conf/global'

async function startBackgroundWorkers() {
  await initializePsychicApplication()

  console.log('STARTING WORKERS')

  background.work()

  background.workers.forEach(worker => {
    worker.on('failed', (job, error) => {
      console.error(job, error)
    })
  })

  console.log('FINISHED STARTING WORKERS')

  process.on('SIGINT', () => {
    stopBackgroundWorkers()
      .then(() => {
        closeAllDbConnections()
          .then(() => {
            process.exit()
          })
          .catch(() => {
            process.exit()
          })
      })
      .catch(() => {
        process.exit()
      })
  })
}

void startBackgroundWorkers()
