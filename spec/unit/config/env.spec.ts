import PsychicConfig from '../../../src/config'
import { PsychicHookEventType } from '../../../src/config/types'
import PsychicServer from '../../../src/server'
import * as hooksModule from '../../../test-app/conf/hooks'

describe('PsychicConfig', () => {
  let config: PsychicConfig

  beforeEach(() => {
    ;(process.env as any).__PSYCHIC_HOOKS_TEST_CACHE = []
    config = new PsychicConfig(new PsychicServer().app)
    jest.spyOn(hooksModule, '__forTestingOnly').mockImplementation(() => {})
  })

  function expectHookCalled(hookEventType: PsychicHookEventType) {
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).toEqual(
      expect.arrayContaining([hookEventType])
    )
  }

  function expectHookNotCalled(hookEventType: PsychicHookEventType) {
    expect((process.env as any).__PSYCHIC_HOOKS_TEST_CACHE.split(',')).not.toEqual(
      expect.arrayContaining([hookEventType])
    )
  }

  it('loads conf/hooks.ts', async () => {
    await config.boot()
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

    it('loads conf/hooks/testing.ts', async () => {
      await config.boot()

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

    it('loads conf/hooks/prod.ts', async () => {
      await config.boot()
      expectHookCalled('load')
      expectHookCalled('load:prod')
      expectHookNotCalled('load:test')
      expectHookNotCalled('load:dev')
    })
  })
})
