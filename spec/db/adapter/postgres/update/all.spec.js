import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#update#all', () => {
  it ('performs update query, passing updates to attributes', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'james' }])
    await postgres.insert('users', [{ email: 'fishman' }])

    const rows = await postgres.update('users', { email: 'jammin' })
    expect(rows.length).toBe(2)

    const results = await postgres.select(['email'], { from: 'users', where: { email: 'jammin' } })
    expect(results.length).toBe(2)
  })
})

