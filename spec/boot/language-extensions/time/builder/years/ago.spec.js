import 'jest-date'
import moment from 'moment'

describe ('Number#years ago', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .years.ago
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(
      new moment().subtract(5, 'years').toDate()
    )
  })
})
