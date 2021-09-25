import Query from 'src/db/query'
import db from 'src/db'

describe('DB#update', () => {
  it ('passes along args to adapter', async () => {
    const spy = eavesdrop()
    posess(Query.prototype, 'adapter', 'get').returning({ update: spy })
    await db.update('users', { fish: 10 }).do()
    expect(spy).toHaveBeenCalledWith('users', { fish: 10 }, { from: 'users' })
  })
})
