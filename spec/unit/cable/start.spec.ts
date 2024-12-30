import { describe as context } from '@jest/globals'
import http from 'http'
import Cable from '../../../src/cable'
import PsychicServer from '../../../src/server'

describe('cable#start', () => {
  let server: PsychicServer
  let cable: Cable
  beforeEach(() => {
    server = new PsychicServer()
    cable = new Cable(server.app, server.config)
    http.createServer(server.app)
    cable.connect()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    jest.spyOn(cable.io!, 'on').mockReturnValue(null as any)
    jest.spyOn(cable, 'listen').mockImplementation(async () => {})
    jest.spyOn(cable, 'connect')
  })

  it('calls cable#connect to establish io and http server if they arent already established', async () => {
    await cable.start()
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(cable.connect).toHaveBeenCalled()
  })

  it('calls cable#listen to start http server and sidechain io server to it', async () => {
    await cable.start()
    const port = 7777
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(cable.listen).toHaveBeenCalledWith({ port: port, withFrontEndClient: false, frontEndPort: 3000 })
  })

  it('attaches a socket io instance to the cable instance', async () => {
    await cable.start()
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(cable.io!.on).toHaveBeenCalled()
  })

  context('psychic is configured for redis as well', () => {
    it('creates additional redis bindings', async () => {
      // TODO: add coverage here.
    })
  })
})
