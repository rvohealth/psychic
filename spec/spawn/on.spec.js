import { jest } from '@jest/globals'
import Spawn from 'src/spawn'

const spawn = new Spawn()

describe ('Spawn#on', () => {
  it ('passes to bree', () => {
    const spy = jest.spyOn(spawn._bree, 'add')
    const cb = jest.fn()
    const date = 3 .minutes.fromNow.toDate()

    spawn.on(date, cb)

    expect(spy).toHaveBeenCalledWith({
      name: md5(cb.toString() + '::' + date.toString()),
      date,
      path: `(${cb.toString()})()`,
      worker: {
         eval: true,
      },
    })
  })

  context ('date is in past', () => {
    it.skip('raises', () => {})
  })
})

