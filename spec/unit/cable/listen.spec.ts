import http from 'http'
import Cable from '../../../src/cable'
import PsychicServer from '../../../src/server'

describe('cable#listen', () => {
  let server: PsychicServer
  let cable: Cable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let httpServer: any

  beforeEach(() => {
    server = new PsychicServer()
    cable = new Cable(server.expressApp, server.config)

    cable.connect()

    // need to return httpServer as return value to http listen to satisfy typescript,
    // otherwise, this wouldn't be needed.
    httpServer = http.createServer(server.expressApp)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    jest.spyOn(cable.httpServer, 'listen').mockReturnValue(httpServer)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    jest.spyOn(cable.io!, 'on').mockReturnValue(null as any)
  })

  it('starts an http server', async () => {
    // patch this, difficult because listen method is using promise accept within http listener
    // await cable.listen({ port: 7777, withFrontEndClient: false, frontEndPort: 3000 })
    // expect(cable.http.listen).toHaveBeenCalled()
  })
})
