import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#addColumn', () => {
  beforeEach(async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'email' }])
    expect(await postgres.hasColumn('users', 'zombo')).toBe(false)
  })

  it ('sets null to true', async () => {
    await postgres.addColumn('users', 'zombo', 'text')
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info.is_nullable).toEqual('YES')
  })

  it ('applies nullable constraint', async () => {
    await postgres.addColumn('users', 'zombo', 'text', { nullable: false })
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info.is_nullable).toEqual('NO')
  })
})

