import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#table#dropAll', () => {
  it ('drops all tables', async () => {
    expect(await postgres.tableExists('users')).toBe(false)
    expect(await postgres.tableExists('bruisers')).toBe(false)

    await db.createTable('users', t => {
      t.string('email')
    })
    await db.createTable('bruisers', t => {
      t.string('bremail')
    })

    expect(await postgres.tableExists('users')).toBe(true)
    expect(await postgres.tableExists('bruisers')).toBe(true)

    await postgres.dropAllTables()

    expect(await postgres.tableExists('users')).toBe(false)
    expect(await postgres.tableExists('bruisers')).toBe(false)
  })
})
