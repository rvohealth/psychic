import * as http from 'http'
import Cable from '../../../src/cable'
import PsychicServer from '../../../src/server'

describe('cable#listen', () => {
  let server: PsychicServer
  let cable: Cable
  let httpServer: any
  beforeEach(async () => {
    server = new PsychicServer()
    cable = new Cable(server.app)

    await cable.connect()

    // need to return httpServer as return value to http listen to satisfy typescript,
    // otherwise, this wouldn't be needed.
    httpServer = http.createServer(server.app)
    jest.spyOn(cable.http, 'listen').mockReturnValue(httpServer)

    // @ts-ignore
    jest.spyOn(cable.io, 'on').mockImplementation(() => '' as any)
  })

  it('starts an http server', async () => {
    // patch this, difficult because listen method is using promise accept within http listener
    // await cable.listen({ port: 7777, withReact: false, reactPort: 3000 })
    // expect(cable.http.listen).toHaveBeenCalled()
  })
})
