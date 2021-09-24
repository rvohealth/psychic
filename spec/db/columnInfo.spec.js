import db from 'src/db'

describe('DB#columnInfo', () => {
  it ('calls columnInfo on underlying adapter', async () => {
    const spy = eavesdrop()
    posess(db, 'adapter', 'get').returning({ columnInfo: spy, closeConnection: () => {} })
    await db.columnInfo('users', 'id')
    expect(spy).toHaveBeenCalledWith('users', 'id')
  })
})
