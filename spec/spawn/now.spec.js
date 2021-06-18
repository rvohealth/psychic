import { jest } from '@jest/globals'
import Spawn from 'src/spawn'

describe ('Spawn#now', () => {
  class SpawnTester {
    static test(arg1, arg2) {
      console.log('FROM WITHIN', arg1, arg2)
    }
  }

  it ('passes to bree', () => {
    const spawn = new Spawn()
    spawn.now(SpawnTester, 'test', ['fish', 10])
  })
})

