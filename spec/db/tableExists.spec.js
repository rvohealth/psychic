import db from 'src/db'

describe('DB#tableExists', () => {
  it ('renames table', async () => {
    const spy = eavesdrop()
    const adapterSpy = posess(db, 'adapter', 'get').returning({ tableExists: spy })
    await db.tableExists('users')
    expect(spy).toHaveBeenCalledWith('users')
    adapterSpy.mockRestore()
  })
})
