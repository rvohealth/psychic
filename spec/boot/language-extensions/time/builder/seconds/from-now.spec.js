import 'jest-date'
import moment from 'moment'

describe ('Number#seconds fromNow', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .seconds.fromNow
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(new moment().add(5, 'seconds').toDate())
  })
})
