import Query from 'src/db/query'
import db from 'src/db'

describe('DB#count', () => {
  it ('passes along args to adapter', async () => {
    const spy = eavesdrop()
    posess(Query.prototype, 'adapter', 'get').returning({ select: spy })
    await db.count('users').do()
    expect(spy).toHaveBeenCalledWith([ 'count(*)' ], { from: 'users' })
  })
})
