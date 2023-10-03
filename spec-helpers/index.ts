import '@rvohealth/dream/spec-helpers'
import background from '../src/background'

// Example usage:
//   const bgComplete = backgroundJobCompletionPromise()
//   await UserEventHandler.handleUserEvent(userEvent)
//   await bgComplete
// At this point, the background job will have run

export async function backgroundJobCompletionPromise() {
  await background.connect()
  return new Promise(accept => {
    background.workers.forEach(worker => {
      worker.addListener('completed', () => {
        accept(undefined)
      })
    })
  })
}
