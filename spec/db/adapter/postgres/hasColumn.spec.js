import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#hasColumn', () => {
  it ('returns true with existing column and false without', async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'email' }])
    expect(await postgres.hasColumn('users', 'email')).toBe(true)
    expect(await postgres.hasColumn('users', 'zombo')).toBe(false)
  })
})

