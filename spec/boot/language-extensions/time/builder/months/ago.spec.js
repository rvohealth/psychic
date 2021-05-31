import 'jest-date'
import moment from 'moment'

describe ('Number#months ago', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .months().ago()
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(new moment().subtract(5, 'months').toDate())
  })
})
