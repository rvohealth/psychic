import { PsychicServer } from '../../../src/index.js'
import { PsychicHookEventType } from '../../../src/psychic-application/types.js'

describe('PsychicServer hooks', () => {
  let server: PsychicServer

  beforeEach(() => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    server = new PsychicServer()
  })

  function expectHookCalled(hookEventType: PsychicHookEventType) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).toEqual(
      expect.arrayContaining([hookEventType]),
    )
  }

  it('processes hooks for server:init', async () => {
    await server.boot()
    expectHookCalled('server:init')
  })

  it('processes hooks for server:start', async () => {
    await server.start()
    expectHookCalled('server:start')
    await server.stop()
  })

  it('processes hooks for server:shutdown', async () => {
    await server.start()
    await server.stop()
    expectHookCalled('server:shutdown')
  })

  it('processes hooks for server:shutdown:final', async () => {
    await server.start()
    await server.stop()
    expectHookCalled('server:shutdown:final')
  })
})
