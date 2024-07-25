import { PsychicServer } from '../../../src'
import { PsychicHookEventType } from '../../../src/psyconf/types'

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

  it('loads conf/app.ts and processes hooks for load:test', async () => {
    await server.boot()
    expectHookCalled('server:init')
  })
})
