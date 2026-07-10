import * as net from 'node:net'
import { MockInstance } from 'vitest'
import { PsychicApp, PsychicServer } from '../../../src/package-exports/index.js'

describe('PsychicServer signal handling', () => {
  let server: PsychicServer
  let handlers: Record<string, (...args: unknown[]) => void>
  let exitSpy: MockInstance
  let logWithLevelSpy: MockInstance

  async function freePort(): Promise<number> {
    const probe = net.createServer()
    await new Promise<void>(resolve => {
      probe.listen(0, () => resolve())
    })
    const port = (probe.address() as net.AddressInfo).port
    await new Promise<void>(resolve => {
      probe.close(() => resolve())
    })
    return port
  }

  beforeEach(async () => {
    handlers = {}
    vi.spyOn(process, 'on').mockImplementation(((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler
      return process
    }) as typeof process.on)

    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    logWithLevelSpy = vi.spyOn(PsychicApp, 'logWithLevel').mockReturnValue(undefined)

    server = new PsychicServer()
    await server.start(await freePort())
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    await server.stop()
  })

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    context(signal, () => {
      it('exits with code 0 after clean graceful shutdown', async () => {
        const stopSpy = vi.spyOn(server, 'stop').mockResolvedValue(undefined)

        handlers[signal]!()

        await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0))
        expect(stopSpy).toHaveBeenCalled()
      })

      context('when graceful shutdown rejects (e.g. a throwing server:shutdown hook)', () => {
        it('logs at error level and exits with code 1 instead of leaving the process alive', async () => {
          vi.spyOn(server, 'stop').mockRejectedValue(new Error('shutdown failure'))

          handlers[signal]!()

          await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1))
          expect(logWithLevelSpy).toHaveBeenCalledWith('error', expect.anything(), expect.anything())
        })
      })

      context('when graceful shutdown hangs', () => {
        it('exits with code 1 once the shutdown timeout elapses', async () => {
          vi.useFakeTimers()
          vi.spyOn(server, 'stop').mockImplementation(() => new Promise(() => {}))

          handlers[signal]!()

          await vi.advanceTimersByTimeAsync(PsychicServer.SHUTDOWN_TIMEOUT_MS)
          expect(exitSpy).toHaveBeenCalledWith(1)
        })
      })
    })
  }
})
