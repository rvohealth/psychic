import { describe as context } from '@jest/globals'
import PsychicApplication from '../../../../src/psychic-application'

describe('PsychicApplication set("cookie", ...opts)', () => {
  let config: PsychicApplication

  beforeEach(() => {
    config = new PsychicApplication()
  })

  context('milliseconds unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of milliseconds', () => {
      config.set('cookie', { maxAge: { milliseconds: 31 } })
      expect(config.cookieOptions).toEqual({ maxAge: 31 })
    })
  })

  context('seconds unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of seconds in milliseconds', () => {
      config.set('cookie', { maxAge: { seconds: 31 } })
      expect(config.cookieOptions).toEqual({ maxAge: 31000 })
    })
  })

  context('minutes unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of minutes in milliseconds', () => {
      config.set('cookie', { maxAge: { minutes: 1 } })
      expect(config.cookieOptions).toEqual({ maxAge: 60 * 1000 })
    })
  })

  context('hours unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of hours in milliseconds', () => {
      config.set('cookie', { maxAge: { hours: 1 } })
      expect(config.cookieOptions).toEqual({ maxAge: 60 * 60 * 1000 })
    })
  })

  context('days unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of days in milliseconds', () => {
      config.set('cookie', { maxAge: { days: 31 } })
      expect(config.cookieOptions).toEqual({ maxAge: 31 * 60 * 60 * 24 * 1000 })
    })
  })

  context('with multiple fields set', () => {
    it('combines multiple fields to yield milliseconds', () => {
      config.set('cookie', { maxAge: { days: 1, hours: 1, minutes: 1, seconds: 1, milliseconds: 1 } })

      const daysMillis = 60 * 60 * 24 * 1000
      const hoursMillis = 1000 * 60 * 60
      const minutesMillis = 60 * 1000
      const millisecondsMillis = 1
      const secondsMillis = 1000
      const expectedMaxAge = daysMillis + hoursMillis + minutesMillis + secondsMillis + millisecondsMillis

      expect(config.cookieOptions).toEqual({ maxAge: expectedMaxAge })
    })
  })
})
