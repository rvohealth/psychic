import I18nDefaultLocales from '../../../src/i18n/conf/I18nDefaultLocales.js'
import I18nProvider, {
  I18nInterpolationKeyContainsBrace,
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
        literalOpening: 'Type %{ to insert a variable, %{name}',
      },
      fallback: {
        onlyInBase: 'Only in the base locale',
        withInterpolation: 'Hello %{name}, only in the base locale',
      },
      account: {
        title: 'Base title',
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
      account: 'Cuenta',
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

  context('with a key missing from the requested locale', () => {
    it('returns the base locale translation', () => {
      expect(i18n('es-ES', 'fallback.onlyInBase')).toEqual('Only in the base locale')
    })

    it('interpolates the base locale translation', () => {
      expect(i18n('es-ES', 'fallback.withInterpolation', { name: 'Bruno' })).toEqual(
        'Hello Bruno, only in the base locale',
      )
    })

    it('does not treat a string at an ancestor of the key as its translation', () => {
      expect(i18n('es-ES', 'account.title')).toEqual('Base title')
    })
  })

  context('with a key missing from every locale', () => {
    it('returns the original translation key', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(i18n('es-ES', 'this.not.found' as any)).toEqual('this.not.found')
    })
  })

  context('with a key that resolves to a nested object rather than a string', () => {
    it('returns the original translation key', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(i18n('en-US', 'chalupas.on' as any)).toEqual('chalupas.on')
    })
  })

  context('with a base locale other than en', () => {
    const i18nWithSpanishBase = I18nProvider.provide(
      {
        es: { greeting: 'Hola', farewell: 'Adiós' },
        fr: { greeting: 'Bonjour' },
      } as const,
      'es',
    )

    it('falls back to the base locale for an unsupported locale', () => {
      expect(i18nWithSpanishBase('de-DE', 'greeting')).toEqual('Hola')
    })

    it('falls back to the base locale for a key missing from the requested locale', () => {
      expect(i18nWithSpanishBase('fr-FR', 'greeting')).toEqual('Bonjour')
      expect(i18nWithSpanishBase('fr-FR', 'farewell')).toEqual('Adiós')
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

    it('interpolates an empty key, and excludes braces from each placeholder name', () => {
      expect(i18n('en-US', 'interpolation.unusualKeys', { '': 'empty', a: 'short' })).toEqual(
        'empty and shortb}',
      )
    })

    context('with an interpolation key that contains a closing brace', () => {
      it('throws I18nInterpolationKeyContainsBrace naming the key', () => {
        expect(() => i18n('en-US', 'interpolation.unusualKeys', { 'a}b': 'braced' })).toThrowError(
          I18nInterpolationKeyContainsBrace,
        )
        expect(() =>
          i18n('en-US', 'interpolation.unusualKeys', { a: 'short', 'a}b': 'braced' }),
        ).toThrowError(/interpolationKey: a}b/)
      })
    })

    it('interpolates a placeholder that follows a literal %{ with no closing brace', () => {
      expect(i18n('en-US', 'interpolation.literalOpening', { name: 'Ana' })).toEqual(
        'Type %{ to insert a variable, Ana',
      )
    })

    context('with an interpolation key that contains an opening brace', () => {
      it('throws I18nInterpolationKeyContainsBrace naming the key', () => {
        expect(() => i18n('en-US', 'interpolation.literalOpening', { 'a{b': 'braced' })).toThrowError(
          I18nInterpolationKeyContainsBrace,
        )
        expect(() =>
          i18n('en-US', 'interpolation.literalOpening', { name: 'Ana', 'a{b': 'braced' }),
        ).toThrowError(/interpolationKey: a{b/)
      })
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
