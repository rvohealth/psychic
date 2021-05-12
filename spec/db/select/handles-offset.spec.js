import { jest } from '@jest/globals'
import db from 'src/db'
import Query from 'src/db/query'

describe('DB#select handles offset', () => {
  it ('passes offset to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email')
      .from('users')
      .offset(3)
      .do()
    expect(spy).toHaveBeenCalledWith(['email'], { from: 'users', offset: 3 })
    adapterSpy.mockRestore()
  })
})
