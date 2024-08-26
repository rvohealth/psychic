import '@rvohealth/dream/spec-helpers'

import background from '../src/background'
import PsychicServer from '../src/server'
import _specRequest from '../spec-helpers/spec-request'

export { SpecRequest } from './spec-request'

// Example usage:
//   const bgComplete = backgroundJobCompletionPromise()
//   await UserEventHandler.handleUserEvent(userEvent)
//   await bgComplete
// At this point, the background job will have run

export async function backgroundJobCompletionPromise() {
  background.connect()
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
  if (_server) return _server!

  const server = new PsychicServer()
  await server.boot()
  return server
}

export const specRequest = _specRequest
