import { CalendarDate, DateTime } from '@rvoh/dream'
import toJson from '../../../src/helpers/toJson.js'

describe('toJson', () => {
  context('without sanitization', () => {
    context('a character preceded by a backslash', () => {
      it('parses back to the original string', () => {
        const original = '\\"'
        const sanitized = toJson(original, false)
        expect(JSON.parse(sanitized)).toEqual(original)
      })
    })

    context('double backslashes', () => {
      it('parses back to the original string', () => {
        const original = '\\\\'
        expect(JSON.parse(toJson(original, false))).toEqual(original)
      })
    })

    it('converts keys and nested keys to json without sanitizing', () => {
      const original = ['h<llo', { 'w<rld': 'g<odbye' }]
      expect(toJson(original, false)).toEqual('["h<llo",{"w<rld":"g<odbye"}]')
    })
  })

  context('with sanitization', () => {
    context('an escaped character', () => {
      it('is the character preceded by a unicode version of a backslash that parses back to the original string', () => {
        const original = '\\"'
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual('"\\u005c\\u0022"')
        expect(JSON.parse(sanitized)).toEqual(original)
      })
    })

    context('a string', () => {
      it('is the sanitized string', () => {
        const original = 'h<llo'
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual('"h\\u003cllo"')
      })
    })

    context('a number', () => {
      it('is the same number', () => {
        const original = 7
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual('7')
      })
    })

    context('a bolean', () => {
      it('is the same boolean', () => {
        const original = true
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual('true')
      })
    })

    context('undefined', () => {
      it('is undefined', () => {
        const original = undefined
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual('{}')
      })
    })

    context('null', () => {
      it('is null', () => {
        const original = null
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual('null')
      })
    })

    context('a DateTime', () => {
      it('is the ISO string version', () => {
        const original = DateTime.now()
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual(`"${original.toISO()}"`)
      })
    })

    context('a CalendarDate', () => {
      it('is the ISO string version', () => {
        const original = CalendarDate.today()
        const sanitized = toJson(original, true)
        expect(sanitized).toEqual(`"${original.toISO()}"`)
      })
    })

    it('sanitizes arrays', () => {
      const sanitized = toJson([7, 'wo<ld'], true)
      expect(sanitized).toEqual('[7,"wo\\u003cld"]')
    })

    it('sanitizes empty arrays', () => {
      const sanitized = toJson([], true)
      expect(sanitized).toEqual('[]')
    })

    it('sanitizes strings in objects, NOT including keys', () => {
      const original: Record<string, string> = { 'h<llo': 'wo<ld' }
      const sanitized = toJson(original, true)
      expect(sanitized).toEqual('{"h<llo":"wo\\u003cld"}')
    })

    it('sanitizes empty javascript objects', () => {
      const sanitized = toJson({}, true)
      expect(sanitized).toEqual('{}')
    })

    it('sanitizes nested strings in objects, NOT including keys', () => {
      const original = ['h<llo', { 'w<rld': 'g<odbye' }]
      const sanitized = toJson(original, true)

      expect(sanitized).toEqual('["h\\u003cllo",{"w<rld":"g\\u003codbye"}]')
    })
  })

  it('automatically interprets back to the original string', () => {
    const input = '<&>'
    const sanitized = toJson(input, true)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(sanitized)
    expect(parsed).toEqual(input)
  })

  it('string representations of the unicode replacements survive sanitizing and parsing', () => {
    const input = '\\u033cd'
    const sanitized = toJson(input, true)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(sanitized)
    expect(parsed).toEqual(input)
  })
})
