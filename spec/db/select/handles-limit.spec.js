import { jest } from '@jest/globals'
import db from 'src/singletons/db'
import Query from 'src/db/query'

describe('DB#select handles limit', () => {
  it ('passes limit to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email')
      .from('users')
      .limit(3)
      .do()
    expect(spy).toHaveBeenCalledWith(['email'], { from: 'users', limit: 3 })
    adapterSpy.mockRestore()
  })
})
