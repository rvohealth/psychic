import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src/package-exports/index.js'

describe('PsychicServer hooks', () => {
  let server: PsychicServer

  beforeEach(() => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    server = new PsychicServer()
  })

  function expectHookCalled(hookEventType: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).toEqual(
      expect.arrayContaining([hookEventType]),
    )
  }

  it('processes hooks for server:init', async () => {
    await server.boot()
    expectHookCalled('server:init:before-middleware')
    expectHookCalled('server:init:after-middleware')
    expectHookCalled('server:init:after-routes')
  })

  it('processes hooks for "use"', async () => {
    await request.init(PsychicServer)
    await request.get('/ok', 200)
    expectHookCalled('use')
    expectHookCalled('use:before-middleware')
    expectHookCalled('use:after-middleware')
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
})
