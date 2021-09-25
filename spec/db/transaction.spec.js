import db from 'src/db'

describe('DB#transaction', () => {
  it ('passes cb to underlying adapter', async () => {
    const spy = eavesdrop()
    const cb = eavesdrop()
    posess(db, 'adapter', 'get').returning({ transaction: spy })
    await db.transaction(cb)
    expect(spy).toHaveBeenCalledWith(cb)
  })
})
