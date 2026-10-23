import PsychicApp from '../../../../src/psychic-app/index.js'

describe('PsychicApp set("cors", ...opts)', () => {
  let config: PsychicApp

  beforeEach(() => {
    config = new PsychicApp()
  })

  context('when the app never sets cors', () => {
    it('leaves corsOptions undefined', () => {
      expect(config.corsOptions).toBeUndefined()
    })
  })

  context('when cors is set', () => {
    it('returns the options', () => {
      config.set('cors', { origin: 'https://example.com' })
      expect(config.corsOptions).toEqual({ origin: 'https://example.com' })
    })

    it('types corsOptions as possibly undefined, so reading a property needs a check', () => {
      config.set('cors', { origin: 'https://example.com' })

      // @ts-expect-error — corsOptions is undefined until the app calls psy.set('cors', …);
      // the ts-expect-error itself is the compile-time proof
      expect(config.corsOptions.origin).toEqual('https://example.com')
    })
  })
})
