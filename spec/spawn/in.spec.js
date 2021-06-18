import { jest } from '@jest/globals'
import Spawn from 'src/spawn'

const spawn = new Spawn()

describe ('Spawn#in', () => {
  it ('passes to bree', () => {
    const spy = jest.spyOn(spawn._bree, 'add')
    const cb = jest.fn()
    const _in = '12 hours and 3 minutes'

    spawn.in(_in, cb)

    expect(spy).toHaveBeenCalledWith({
      name: md5(cb.toString() + '::' + _in),
      timeout: 43380000,
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

