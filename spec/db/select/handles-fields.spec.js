import { jest } from '@jest/globals'
import db from 'src/db'
import Query from 'src/db/query'

describe('DB#select handles fields', () => {
  it ('passes off instance of query', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .select('email')
      .from('users')
      .do()
    expect(spy).toHaveBeenCalledWith(['email'], { from: 'users' })
    adapterSpy.mockRestore()
  })
})
