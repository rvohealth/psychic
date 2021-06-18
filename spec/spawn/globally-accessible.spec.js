import { jest } from '@jest/globals'

describe ('spawn#cron', () => {
  it ('passes to bree', () => {
    const spy = jest.spyOn(spawn._bree, 'add')
    const cb = jest.fn()
    const cron = '15 10 * * *'

    spawn.cron(cron, cb)

    expect(spy).toHaveBeenCalledWith({
      name: md5(cb.toString() + '::' + cron),
      cron,
      path: `(${cb.toString()})()`,
      worker: {
         eval: true,
      },
      cronValidate: {
        useBlankDay: true,
      },
      interval: {
        exceptions: [],
        schedules: [
          {
            h: [10],
            m: [15],
            s: [0],
          },
        ],
      },
    })
  })

  context ('date is in past', () => {
    it.skip('raises', () => {})
  })
})

