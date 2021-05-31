import 'jest-date'
import moment from 'moment'

describe ('Number#minutes fromNow', () => {
  it ('returns a TimeBuilder instance', () => {
    const time = 5 .minutes().fromNow()
    expect(time.constructor.name).toBe('Moment')
    expect(time.toDate()).toBeSameSecondAs(new moment().add(5, 'minutes').toDate())
  })
})
