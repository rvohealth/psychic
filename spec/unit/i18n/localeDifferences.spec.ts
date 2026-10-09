import I18nProvider from '../../../src/i18n/provider.js'

describe('I18nProvider.localeDifferences', () => {
  const en = {
    places: {
      style: {
        treehouse: 'Treehouse',
        cottage: 'Cottage',
      },
    },
    tickets: 'You are buying %{count} tickets, %{name}',
  } as const

  context('when every locale matches the base locale', () => {
    it('returns an empty list', () => {
      const allLocales = {
        en,
        es: {
          places: { style: { treehouse: 'Casa del árbol', cottage: 'Casita' } },
          tickets: '%{name}, vas a comprar %{count} boletos (%{count})',
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([])
    })
  })

  context('with only the base locale', () => {
    it('returns an empty list', () => {
      expect(I18nProvider.localeDifferences({ en }, 'en')).toEqual([])
    })
  })

  context('with a key missing from a locale', () => {
    it('reports the missing key', () => {
      const allLocales = {
        en,
        es: {
          places: { style: { treehouse: 'Casa del árbol' } },
          tickets: '%{name}, vas a comprar %{count} boletos',
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es is missing "places.style.cottage"',
      ])
    })
  })

  context('with a key that the base locale lacks', () => {
    it('reports the extra key', () => {
      const allLocales = {
        en,
        es: {
          places: { style: { treehouse: 'Casa del árbol', cottage: 'Casita', igloo: 'Iglú' } },
          tickets: '%{name}, vas a comprar %{count} boletos',
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es has "places.style.igloo", which en does not',
      ])
    })
  })

  context('with a string where the base locale has an object', () => {
    it('reports the mismatch once, at that key', () => {
      const allLocales = {
        en,
        es: {
          places: 'Lugares',
          tickets: '%{name}, vas a comprar %{count} boletos',
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es has a string at "places", where en has an object',
      ])
    })
  })

  context('with an object where the base locale has a string', () => {
    it('reports the mismatch once, at that key', () => {
      const allLocales = {
        en,
        es: {
          places: { style: { treehouse: 'Casa del árbol', cottage: 'Casita' } },
          tickets: { one: 'Un boleto' },
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es has an object at "tickets", where en has a string',
      ])
    })
  })

  context('with a value that is neither a string nor an object', () => {
    it('reports the mismatch', () => {
      const allLocales = {
        en,
        es: {
          places: { style: { treehouse: 'Casa del árbol', cottage: ['Casita'] } },
          tickets: null,
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es has an array at "places.style.cottage", where en has a string',
        'es has null at "tickets", where en has a string',
      ])
    })
  })

  context('with a translation whose placeholders differ from the base locale', () => {
    it('reports the placeholders of both', () => {
      const allLocales = {
        en,
        es: {
          places: { style: { treehouse: 'Casa del árbol %{extra}', cottage: 'Casita' } },
          tickets: 'Vas a comprar %{cantidad} boletos',
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es uses %{extra} at "places.style.treehouse", where en uses no placeholders',
        'es uses %{cantidad} at "tickets", where en uses %{count}, %{name}',
      ])
    })
  })

  context('with placeholder names that contain a closing brace', () => {
    it('reports names that differ beyond the first closing brace', () => {
      const allLocales = {
        en: { tickets: 'Buying %{a}b} tickets' },
        es: { tickets: 'Comprando %{a}c} boletos' },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es uses %{a}, %{a}c} at "tickets", where en uses %{a}, %{a}b}',
      ])
    })

    it('returns an empty list when the names match', () => {
      const allLocales = {
        en: { tickets: 'Buying %{a}b} tickets' },
        es: { tickets: 'Comprando %{a}b} boletos' },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([])
    })
  })

  context('with a locale that is not an object of translations', () => {
    it('reports the locale', () => {
      const allLocales = { en, es: 'Español' } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es is a string, not an object of translations',
      ])
    })
  })

  context('with several locales and several differences', () => {
    it('reports every difference, locale by locale', () => {
      const allLocales = {
        en,
        es: {
          places: { style: { treehouse: 'Casa del árbol' } },
          tickets: 'Vas a comprar boletos',
        },
        fr: {
          places: { style: { treehouse: 'Cabane', cottage: 'Chaumière', igloo: 'Igloo' } },
        },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'en')).toEqual([
        'es is missing "places.style.cottage"',
        'es uses no placeholders at "tickets", where en uses %{count}, %{name}',
        'fr has "places.style.igloo", which en does not',
        'fr is missing "tickets"',
      ])
    })
  })

  context('with a base locale other than en', () => {
    it('compares every other locale, including en, with that base', () => {
      const allLocales = {
        en: { greeting: 'Hello' },
        es: { greeting: 'Hola', farewell: 'Adiós' },
      } as const

      expect(I18nProvider.localeDifferences(allLocales, 'es')).toEqual(['en is missing "farewell"'])
    })
  })
})
