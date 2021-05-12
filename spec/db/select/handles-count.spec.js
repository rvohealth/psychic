import { jest } from '@jest/globals'
import db from 'src/db'
import Query from 'src/db/query'

describe('DB#select handles count', () => {
  it ('passes fetch to the underlying adapter', async () => {
    const spy = jest.fn()
    const adapterSpy = jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db
      .count('users')
      .do()
    expect(spy).toHaveBeenCalledWith(['count(*)'], { from: 'users' })
    adapterSpy.mockRestore()
  })
})
