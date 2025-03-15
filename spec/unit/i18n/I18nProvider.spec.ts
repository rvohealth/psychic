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

    context('with an undefined interpolation value', () => {
      it('includes the supplied values in the interpolation', () => {
        expect(() =>
          i18n('en-US', 'chalupas.on.ice.the.tickets', {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
            count: undefined as any,
          }),
        ).toThrowError(I18nInterpolationReceivedUndefined)
      })
    })

    context('with a null interpolation value', () => {
      it('includes the supplied values in the interpolation', () => {
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
