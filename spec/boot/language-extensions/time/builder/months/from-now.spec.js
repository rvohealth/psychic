import 'jest-date'
import moment from 'moment'

describe ('Number#months fromNow', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .months.fromNow
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(new moment().add(5, 'months').toDate())
  })
})
