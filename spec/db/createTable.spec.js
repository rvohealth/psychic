import db from 'src/db'
import CreateTableStatement from 'src/db/statement/table/create'

describe('DB#createTable', () => {
  it ('calls createTable on underlying adapter', async () => {
    const spy = eavesdrop()
    const cb = eavesdrop()
    const mockStatement = { columns: [1,2,3] }

    posess(db, 'adapter', 'get').returning({ createTable: spy, closeConnection: () => {} })
    posess(CreateTableStatement, 'new').returning(mockStatement)

    await db.createTable('users', cb)

    expect(cb).toHaveBeenCalledWith(mockStatement)
    expect(spy).toHaveBeenCalledWith('users', mockStatement.columns)
  })
})
