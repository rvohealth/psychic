import 'jest-date'
import moment from 'moment'

describe ('Number#ago', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .days().ago()
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(new moment().subtract(5, 'days').toDate())
  })
})
