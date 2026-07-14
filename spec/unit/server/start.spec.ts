import * as net from 'node:net'
import { PsychicServer } from '../../../src/package-exports/index.js'

describe('PsychicServer#start', () => {
  context('when the port is already in use', () => {
    let blockingServer: net.Server
    let port: number

    beforeEach(async () => {
      blockingServer = net.createServer()
      await new Promise<void>(resolve => {
        blockingServer.listen(0, () => resolve())
      })
      port = (blockingServer.address() as net.AddressInfo).port
    })

    afterEach(async () => {
      await new Promise<void>(resolve => {
        blockingServer.close(() => resolve())
      })
    })

    it('rejects with the listen error instead of hanging forever', async () => {
      const server = new PsychicServer()
      await expect(server.start(port)).rejects.toMatchObject({ code: 'EADDRINUSE' })
    })
  })
})
