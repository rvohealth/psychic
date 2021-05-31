import 'jest-date'
import moment from 'moment'

describe ('Number#hours ago', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .hours().ago()
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(
      new moment().subtract(5, 'hours').toDate()
    )
  })
})
