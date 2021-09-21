import { jest } from '@jest/globals'
import db from 'src/singletons/db'
import Query from 'src/db/query'

describe('DB#select handles having', () => {
  it ('passes having to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email', 'count(*)')
      .from('users')
      .having('count(*) = 2')
      .do()
    expect(spy).toHaveBeenCalledWith(['email', 'count(*)'], { from: 'users', having: 'count(*) = 2' })
    adapterSpy.mockRestore()
  })
})
