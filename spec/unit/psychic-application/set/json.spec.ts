import PsychicApp from '../../../../src/psychic-app/index.js'

describe('PsychicApp set("json", ...opts)', () => {
  let config: PsychicApp

  beforeEach(() => {
    config = new PsychicApp()
  })

  context('when the app never sets json', () => {
    it('leaves jsonOptions undefined', () => {
      expect(config.jsonOptions).toBeUndefined()
    })
  })

  context('when json is set', () => {
    it('returns the options', () => {
      config.set('json', { jsonLimit: '256kb' })
      expect(config.jsonOptions).toEqual({ jsonLimit: '256kb' })
    })

    it('spread-merges the options across calls, so a partial override keeps the others', () => {
      config.set('json', { jsonLimit: '256kb', formLimit: '10kb' })
      config.set('json', { jsonLimit: '512kb' })
      expect(config.jsonOptions).toEqual({ jsonLimit: '512kb', formLimit: '10kb' })
    })

    it('types jsonOptions as possibly undefined, so reading a property needs a check', () => {
      config.set('json', { jsonLimit: '256kb' })

      // @ts-expect-error — jsonOptions is undefined until the app calls psy.set('json', …);
      // the ts-expect-error itself is the compile-time proof
      expect(config.jsonOptions.jsonLimit).toEqual('256kb')
    })
  })
})
