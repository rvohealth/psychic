import { PsychicHookEventType } from '../../../src/config/types'
import PsychicServer from '../../../src/server'

const server = new PsychicServer()

describe('PsychicServer#boot', () => {
  beforeEach(() => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
  })

  function expectHookCalled(hookEventType: PsychicHookEventType) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).toEqual(
      expect.arrayContaining([hookEventType])
    )
  }

  function expectHookNotCalled(hookEventType: PsychicHookEventType) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).not.toEqual(
      expect.arrayContaining([hookEventType])
    )
  }

  it('loads conf/app.ts and processes hooks for load:test', async () => {
    expectHookNotCalled('ws:init')
    await server.boot()
    expectHookCalled('ws:init')
  })
})
