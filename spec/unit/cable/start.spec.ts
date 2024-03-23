import http from 'http'
import Cable from '../../../src/cable'
import PsychicServer from '../../../src/server'
import { Server } from 'http'

describe('cable#start', () => {
  let server: PsychicServer
  let cable: Cable
  let httpServer: any
  beforeEach(async () => {
    server = new PsychicServer()
    cable = new Cable(server.app)
    httpServer = http.createServer(server.app)
    await cable.connect()

    // @ts-ignore
    jest.spyOn(cable.io, 'on').mockImplementation(() => '' as any)
    jest.spyOn(cable, 'listen').mockImplementation(async () => {})
    jest.spyOn(cable, 'connect')
  })

  it('calls cable#connect to establish io and http server if they arent already established', async () => {
    await cable.start()
    expect(cable.connect).toHaveBeenCalled()
  })

  it('calls cable#listen to start http server and sidechain io server to it', async () => {
    await cable.start()
    const port = 7777
    expect(cable.listen).toHaveBeenCalledWith({ port: port, withFrontEndClient: false, frontEndPort: 3000 })
  })

  it('attaches a socket io instance to the cable instance', async () => {
    await cable.start()
    // @ts-ignore
    expect(cable.io.on).toHaveBeenCalled()
  })

  context('psychic is configured for redis as well', () => {
    it('creates additional redis bindings', async () => {
      // TODO: add coverage here.
    })
  })
})
