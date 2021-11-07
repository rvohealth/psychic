import db from 'src/db'
import Query from 'src/db/query'

describe('DB#select handles count', () => {
  it ('passes fetch to the underlying adapter', async () => {
    const spy = eavesdrop()
    const adapterSpy = posess(Query.prototype, 'adapter', 'get').returning({ select: spy })
    await db
      .count('users')
      .do()
    expect(spy).toHaveBeenCalledWith(['count(*)'], { from: 'users' })
    adapterSpy.mockRestore()
  })
})
