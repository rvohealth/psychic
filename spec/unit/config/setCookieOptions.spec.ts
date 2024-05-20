import { describe as context } from '@jest/globals'
import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'

describe('PsychicConfig', () => {
  let config: PsychicConfig

  beforeEach(() => {
    config = new PsychicConfig(new PsychicServer().app)
  })

  context('milliseconds unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of milliseconds', () => {
      config.setCookieOptions({ maxAge: { milliseconds: 31 } })
      expect(config.cookieOptions).toEqual({ maxAge: 31 })
    })
  })

  context('seconds unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of seconds in milliseconds', () => {
      config.setCookieOptions({ maxAge: { seconds: 31 } })
      expect(config.cookieOptions).toEqual({ maxAge: 31000 })
    })
  })

  context('minutes unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of minutes in milliseconds', () => {
      config.setCookieOptions({ maxAge: { minutes: 1 } })
      expect(config.cookieOptions).toEqual({ maxAge: 60 * 1000 })
    })
  })

  context('hours unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of hours in milliseconds', () => {
      config.setCookieOptions({ maxAge: { hours: 1 } })
      expect(config.cookieOptions).toEqual({ maxAge: 60 * 60 * 1000 })
    })
  })

  context('days unit is passed for maxAge', () => {
    it('sets default cookie maxAge to the provided number of days in milliseconds', () => {
      config.setCookieOptions({ maxAge: { days: 31 } })
      expect(config.cookieOptions).toEqual({ maxAge: 31 * 60 * 60 * 24 * 1000 })
    })
  })

  context('with multiple fields set', () => {
    it('combines multiple fields to yield milliseconds', () => {
      config.setCookieOptions({ maxAge: { days: 1, hours: 1, minutes: 1, seconds: 1, milliseconds: 1 } })

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
