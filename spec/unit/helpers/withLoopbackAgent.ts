import http from 'node:http'
import { agent as supertestAgent } from 'supertest'

type KoaApp = { callback(): http.RequestListener }
type LoopbackAgent = ReturnType<typeof supertestAgent>

// supertest binds a server it is handed with a wildcard `listen(0)` and then
// connects to 127.0.0.1. On macOS that wildcard bind can take a port another
// process holds on 127.0.0.1 only, so the request reaches that process instead
// of the app under test. Binding to 127.0.0.1 ourselves, before supertest sees
// the server, rules that out: supertest uses a listening server's port as is.
//
// Same pattern as listenOnLoopback/closeServer in @rvoh/psychic-spec-helpers
// (not exported by the package).
export default async function withLoopbackAgent<T>(
  koaApp: KoaApp,
  callback: (agent: LoopbackAgent) => PromiseLike<T> | T,
): Promise<T> {
  const server = http.createServer(koaApp.callback())

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })

  try {
    return await callback(supertestAgent(server))
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()))
      // the request has finished; don't wait on keep-alive sockets to time out
      server.closeAllConnections()
    })
  }
}
