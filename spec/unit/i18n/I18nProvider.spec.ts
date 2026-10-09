import I18nDefaultLocales from '../../../src/i18n/conf/I18nDefaultLocales.js'
import I18nProvider, {
  I18nInterpolationReceivedNull,
  I18nInterpolationReceivedUndefined,
} from '../../../src/i18n/provider.js'

type LocalesEnum = (typeof I18nDefaultLocales)[number]

describe('I18nProvider.provide', () => {
  let locale: LocalesEnum
  const defaultAllLocales = {
    en: {
      chalupas: {
        on: {
          ice: {
            the: {
              musical: 'You are either there, or you are a square',
              tickets: 'You are going to buy %{count} tickets to chalupas on ice, the musical',
            },
          },
        },
      },
      interpolation: {
        repeated: '%{name} booked %{place}. Thanks, %{name}!',
        total: 'Total: %{price}',
        unknown: 'Hello %{name}, your code is %{code}',
        prototypeNames: 'Hello %{name}, %{constructor} %{toString} %{__proto__}',
        unusualKeys: '%{} and %{a}b}',
      },
    },

    es: {
      chalupas: {
        on: {
          ice: {
            the: {
              musical: 'O estás ahí, o eres un cuadrado',
              tickets: 'Vas a comprar %{count} boletos para chalupas on ice, el musical',
            },
          },
        },
      },
    },
  } as const
  const i18n = I18nProvider.provide(defaultAllLocales, 'en')

  beforeEach(() => {
    locale = 'en-US'
  })

  context('with en-US', () => {
    it('returns the English translation', () => {
      expect(i18n(locale, 'chalupas.on.ice.the.musical')).toEqual('You are either there, or you are a square')
    })
  })

  context('with es-ES', () => {
    it('returns the Spanish translation', () => {
      expect(i18n('es-ES', 'chalupas.on.ice.the.musical')).toEqual('O estás ahí, o eres un cuadrado')
    })
  })

  context('with no translation', () => {
    it('returns the original translation key', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(i18n(locale, 'this.not.found' as any)).toEqual('this.not.found')
    })
  })

  context('with an unsupported locale', () => {
    beforeEach(() => {
      locale = 'de-DE'
    })

    it('returns the English translation', () => {
      expect(i18n(locale, 'chalupas.on.ice.the.musical')).toEqual('You are either there, or you are a square')
    })
  })

  context('with an undefined locale', () => {
    beforeEach(() => {
      locale = 'de-DE'
    })

    it('returns the English translation', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(i18n(undefined as any, 'chalupas.on.ice.the.musical')).toEqual(
        'You are either there, or you are a square',
      )
    })
  })

  context('a translation with interpolation', () => {
    it('includes the supplied values in the interpolation', () => {
      const translation = i18n('en-US', 'chalupas.on.ice.the.tickets', {
        count: 3,
      })
      expect(translation).toEqual('You are going to buy 3 tickets to chalupas on ice, the musical')
    })

    it('replaces every occurrence of a placeholder', () => {
      expect(i18n('en-US', 'interpolation.repeated', { name: 'Bruno', place: 'Denver' })).toEqual(
        'Bruno booked Denver. Thanks, Bruno!',
      )
    })

    it('inserts values containing replacement patterns literally', () => {
      expect(i18n('en-US', 'interpolation.total', { price: '$$5' })).toEqual('Total: $$5')
      expect(i18n('en-US', 'interpolation.total', { price: "$'" })).toEqual("Total: $'")
      expect(i18n('en-US', 'interpolation.total', { price: '$&!' })).toEqual('Total: $&!')
      expect(i18n('en-US', 'interpolation.total', { price: '$`' })).toEqual('Total: $`')
    })

    it('does not interpolate placeholders inside a supplied value', () => {
      expect(i18n('en-US', 'interpolation.repeated', { name: '%{place}', place: 'Denver' })).toEqual(
        '%{place} booked Denver. Thanks, %{place}!',
      )
      expect(i18n('en-US', 'interpolation.repeated', { place: '%{name}', name: 'Bruno' })).toEqual(
        'Bruno booked %{name}. Thanks, Bruno!',
      )
    })

    it('leaves a placeholder with no supplied value as written', () => {
      expect(i18n('en-US', 'interpolation.unknown', { name: 'Bruno' })).toEqual(
        'Hello Bruno, your code is %{code}',
      )
    })

    it('leaves a placeholder named after an Object.prototype member as written', () => {
      expect(i18n('en-US', 'interpolation.prototypeNames', { name: 'Bruno' })).toEqual(
        'Hello Bruno, %{constructor} %{toString} %{__proto__}',
      )
    })

    it('interpolates an empty key and a key containing a closing brace', () => {
      expect(i18n('en-US', 'interpolation.unusualKeys', { '': 'empty', 'a}b': 'braced' })).toEqual(
        'empty and braced',
      )
      expect(i18n('en-US', 'interpolation.unusualKeys', { 'a}b': 'braced', a: 'short' })).toEqual(
        '%{} and braced',
      )
    })

    context('with an undefined interpolation value', () => {
      it('throws I18nInterpolationReceivedUndefined', () => {
        expect(() =>
          i18n('en-US', 'chalupas.on.ice.the.tickets', {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
            count: undefined as any,
          }),
        ).toThrowError(I18nInterpolationReceivedUndefined)
      })
    })

    context('with a null interpolation value', () => {
      it('throws I18nInterpolationReceivedNull', () => {
        expect(() =>
          i18n('en-US', 'chalupas.on.ice.the.tickets', {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
            count: null as any,
          }),
        ).toThrowError(I18nInterpolationReceivedNull)
      })
    })
  })
})
