import 'jest-date'
import moment from 'moment'

describe ('Number#years fromNow', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .years.fromNow
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(new moment().add(5, 'years').toDate())
  })
})
