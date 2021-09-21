import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#renameTable', () => {
  it ('renames table', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })

    expect(await postgres.tableExists('users')).toBe(true)
    expect(await postgres.tableExists('bruisers')).toBe(false)
    await postgres.renameTable('users', 'bruisers')
    expect(await postgres.tableExists('users')).toBe(false)
    expect(await postgres.tableExists('bruisers')).toBe(true)
  })
})

