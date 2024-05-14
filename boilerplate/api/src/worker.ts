import './conf/global'
import { closeAllDbConnections } from '@rvohealth/dream'
import { background, stopBackgroundWorkers } from '@rvohealth/psychic'
import increaseNodeStackTraceLimits from './helpers/increaseNodeStackTraceLimits'
import inflections from './conf/inflections'

increaseNodeStackTraceLimits()

async function startBackgroundWorkers() {
  inflections()

  await background.connect()

  background.workers.forEach(worker => {
    worker.on('failed', (job, error) => {
      handleBullJobFailed(job.id, error.message)
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleBullJobFailed(jobId: string, failedReason: string) {
  // use this function to bind into whatever service you use for error reporting (i.e. datadog or sentry)
  // const job = (await background.queue.getJob(jobId)) || 'Job not found'
}

void startBackgroundWorkers()
