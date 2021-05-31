import 'jest-date'
import moment from 'moment'

describe ('Number#minutes ago', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .minutes.ago
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameMinuteAs(
      new moment().subtract(5, 'minutes').toDate()
    )
  })
})
