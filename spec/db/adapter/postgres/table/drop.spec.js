import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#table#drop', () => {
  it ('drops table', async () => {
    expect(await postgres.tableExists('users')).toBe(false)
    await db.createTable('users', t => {
      t.string('email')
      t.string('password')
    })

    expect(await postgres.tableExists('users')).toBe(true)
    await postgres.dropTable('users')
    expect(await postgres.tableExists('users')).toBe(false)
  })
})
