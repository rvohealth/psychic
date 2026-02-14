import { CalendarDate, ClockTime, ClockTimeTz, DateTime } from '@rvoh/dream'
import toJson from '../../../src/helpers/toJson.js'

describe('toJson', () => {
  context('without sanitization', () => {
    context('a character preceded by a backslash', () => {
      it('parses back to the original string', () => {
        const original = '\\"'
        const sanitized = toJson(original)
        expect(JSON.parse(sanitized)).toEqual(original)
      })
    })

    context('double backslashes', () => {
      it('parses back to the original string', () => {
        const original = '\\\\'
        expect(JSON.parse(toJson(original))).toEqual(original)
      })
    })

    it('converts keys and nested keys to json without sanitizing', () => {
      const original = ['h<llo', { 'w<rld': 'g<odbye' }]
      expect(toJson(original)).toEqual('["h<llo",{"w<rld":"g<odbye"}]')
    })
  })

  context('a DateTime', () => {
    it('is the ISO string version', () => {
      const original = DateTime.now()
      const sanitized = toJson(original)
      expect(sanitized).toEqual(`"${original.toISO()}"`)
    })
  })

  context('a CalendarDate', () => {
    it('is the ISO string version', () => {
      const original = CalendarDate.today()
      const sanitized = toJson(original)
      expect(sanitized).toEqual(`"${original.toISO()}"`)
    })
  })

  context('a ClockTime', () => {
    it('is the ISO string version', () => {
      const original = ClockTime.now()
      const sanitized = toJson(original)
      expect(sanitized).toEqual(`"${original.toISO()}"`)
    })
  })

  context('a ClockTimeTz', () => {
    it('is the ISO string version', () => {
      const original = ClockTimeTz.now()
      const sanitized = toJson(original)
      expect(sanitized).toEqual(`"${original.toISO()}"`)
    })
  })

  it('serializes arrays', () => {
    const serialized = toJson([7, 'wo<ld'])
    expect(serialized).toEqual('[7,"wo<ld"]')
  })

  it('serializes empty arrays', () => {
    const serialized = toJson([])
    expect(serialized).toEqual('[]')
  })

  it('serializes strings in objects, including keys', () => {
    const original: Record<string, string> = { 'h<llo': 'wo<ld' }
    const serialized = toJson(original)
    expect(serialized).toEqual('{"h<llo":"wo<ld"}')
  })

  it('serializes empty javascript objects', () => {
    const serialized = toJson({})
    expect(serialized).toEqual('{}')
  })

  it('serializes nested strings in objects', () => {
    const original = ['h<llo', { 'w<rld': 'g<odbye' }]
    const serialized = toJson(original)

    expect(serialized).toEqual('["h<llo",{"w<rld":"g<odbye"}]')
  })

  it('serializes undefined as empty object', () => {
    const original = undefined
    const serialized = toJson(original)
    expect(serialized).toEqual('{}')
  })

  it('serializes null', () => {
    const original = null
    const serialized = toJson(original)
    expect(serialized).toEqual('null')
  })

  it('serializes numbers', () => {
    const original = 7
    const serialized = toJson(original)
    expect(serialized).toEqual('7')
  })

  it('serializes booleans', () => {
    const original = true
    const serialized = toJson(original)
    expect(serialized).toEqual('true')
  })
})
