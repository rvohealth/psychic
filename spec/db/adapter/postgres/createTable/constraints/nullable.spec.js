import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('sets null to true', async () => {
    await postgres.createTable('users', [{ type: 'numeric', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info.is_nullable).toEqual('YES')
  })

  it ('applies nullable constraint', async () => {
    await postgres.createTable('users', [{ type: 'numeric', name: 'zombo', nullable: false }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info.is_nullable).toEqual('NO')
  })
})

