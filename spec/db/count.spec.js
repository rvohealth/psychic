import { jest } from '@jest/globals'
import Query from 'src/db/query'
import db from 'src/singletons/db'

describe('DB#count', () => {
  it ('passes along args to db', async () => {
    const spy = jest.fn()
    jest.spyOn(Query.prototype, 'adapter', 'get').mockReturnValue({ select: spy })
    await db.count('users').do()
    expect(spy).toHaveBeenCalledWith([ 'count(*)' ], { from: 'users' })
  })
})
