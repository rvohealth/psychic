import { jest } from '@jest/globals'
import db from 'src/singletons/db'
import Query from 'src/db/query'

describe('DB#select handles order', () => {
  it ('passes order to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email')
      .from('users')
      .order(['email'])
      .do()
    expect(spy).toHaveBeenCalledWith(['email'], { from: 'users', order: ['email'] })
    adapterSpy.mockRestore()
  })
})
