import { jest } from '@jest/globals'
import db from 'src/db'
import Query from 'src/db/query'

describe('DB#select handles group', () => {
  it ('passes group to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email', 'count(*)')
      .from('users')
      .group('count(*)')
      .do()
    expect(spy).toHaveBeenCalledWith(['email', 'count(*)'], { from: 'users', group: 'count(*)' })
    adapterSpy.mockRestore()
  })
})
