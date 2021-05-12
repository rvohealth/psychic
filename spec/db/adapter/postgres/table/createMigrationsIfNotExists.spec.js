import PostgresAdapter from 'src/db/adapter/postgres'
let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#table#createMigrationsIfNotExists', () => {
  it ('creates the migrations table', async () => {
    expect(await postgres.tableExists('migrations')).toBe(false)
    await postgres.createMigrationsIfNotExists()
    expect(await postgres.tableExists('migrations')).toBe(true)
  })
})
