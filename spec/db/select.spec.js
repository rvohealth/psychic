import Query from 'src/db/query'
import db from 'src/db'

describe('DB#select', () => {
  it ('passes along args to adapter', async () => {
    const spy = eavesdrop()
    posess(Query.prototype, 'adapter', 'get').returning({ select: spy })
    await db.select('a', 'b', 'c').do()
    expect(spy).toHaveBeenCalledWith(['a', 'b', 'c'], {})
  })
})
