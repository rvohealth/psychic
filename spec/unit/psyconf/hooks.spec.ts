import PsychicApplication from '../../../src/psychic-application'
import { getCachedPsychicApplicationOrFail } from '../../../src/psychic-application/cache'
import { PsychicHookEventType } from '../../../src/psychic-application/types'

describe('PsychicApplication hooks', () => {
  let config: PsychicApplication

  beforeEach(() => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    config = getCachedPsychicApplicationOrFail()
  })

  function expectHookCalled(hookEventType: PsychicHookEventType) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).toEqual(
      expect.arrayContaining([hookEventType]),
    )
  }

  function expectHookNotCalled(hookEventType: PsychicHookEventType) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).not.toEqual(
      expect.arrayContaining([hookEventType]),
    )
  }

  it('loads conf/app.ts and processes hooks for load:test', async () => {
    await config.boot(true)
    expectHookCalled('load')
    expectHookCalled('load:test')
    expectHookNotCalled('load:dev')
    expectHookNotCalled('load:prod')
  })

  context('process.env.NODE_ENV === "development"', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('processes callbacks for load:dev', async () => {
      await config.boot(true)

      expectHookCalled('load')
      expectHookCalled('load:dev')
      expectHookNotCalled('load:test')
      expectHookNotCalled('load:prod')
    })
  })

  context('process.env.NODE_ENV === "production"', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    afterEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('processes callbacks for load:prod', async () => {
      await config.boot(true)
      expectHookCalled('load')
      expectHookCalled('load:prod')
      expectHookNotCalled('load:test')
      expectHookNotCalled('load:dev')
    })
  })
})
