import './conf/global'

import { closeAllDbConnections } from '@rvohealth/dream'
import { background, stopBackgroundWorkers } from '@rvohealth/psychic'
import initializePsychicApplication from './cli/helpers/initializePsychicApplication'
import increaseNodeStackTraceLimits from './helpers/increaseNodeStackTraceLimits'

increaseNodeStackTraceLimits()

async function startBackgroundWorkers() {
  await initializePsychicApplication()

  background.connect()

  background.workers.forEach(worker => {
    worker.on('failed', (job, error) => {
      handleBullJobFailed(job!.id!, error.message)
        .then(() => {})
        .catch(() => {})
    })
  })

  process.on('SIGINT', () => {
    stopBackgroundWorkers()
      .then(() => {
        closeAllDbConnections()
          .then(() => {})
          .catch(() => {})
      })
      .catch(() => {})
  })
}

async function handleBullJobFailed(jobId: string, failedReason: string) {
  // handle your job error here
  // const job = (await background.queue!.getJob(jobId)) || 'Job not found'
}

void startBackgroundWorkers()
