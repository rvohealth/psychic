import '@rvohealth/dream/spec-helpers'
import background from '../src/background'
import PsychicServer from '../src/server'
import _send from './send'

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

const _server: PsychicServer | undefined = undefined
export async function createPsychicServer() {
  if (_server) return _server

  const server = new PsychicServer()
  await server.boot()
  return server
}

export const send = _send
