import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#addColumn', () => {
  it ('adds column to table', async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'email' }])

    expect(await postgres.hasColumn('users', 'zombo')).toBe(false)
    await postgres.addColumn('users', 'zombo', 'text')
    expect(await postgres.hasColumn('users', 'zombo')).toBe(true)
  })
})

