import db from 'src/db'
import PostgresAdapter from 'src/db/adapter/postgres'

describe('DB#drop', () => {
  it ('calls dropDB on adapter', async () => {
    const adapter = new PostgresAdapter()
    posess(db, 'adapter', 'get').returning(adapter)
    const spy = posess(adapter, 'dropDB').returning({ fish: 20 })

    const result = await db.drop()

    expect(spy).toHaveBeenCalled()
    expect(result).toEqual({ fish: 20 })
  })
})
