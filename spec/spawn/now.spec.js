import { jest } from '@jest/globals'
import Spawn from 'src/spawn'

describe ('Spawn#now', () => {
  it ('passes to bree', () => {
    const spawn = new Spawn()
    const spy = jest.spyOn(spawn._bree, 'add')
    const cb = jest.fn()

    spawn.now(cb, { fish: 10 })

    expect(spy).toHaveBeenCalledWith({
      name: md5(cb.toString() + '::' + '0'),
      timeout: 0,
      path: `main`,
      worker: {
        workerData: { fish: 10, cb },
        eval: true,
      },
    })
  })

  context ('accessing globally', () => {
    it.only ('runs cb in bg immediately', async () => {
      bg(id => {
      }, 10)

      await new Promise(accept => {
        setTimeout(() => {
          console.log('DONE')
          accept()
        }, 1000)
      })
    })
  })
})

