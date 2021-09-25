import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#columnInfo', () => {
  it ('adds column to table', async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'email' }])
    const info = await postgres.columnInfo('users', 'email')
    expect(info).toEqual(expect.objectContaining({ column_name: 'email', data_type: 'text', column_default: null }))
  })
})

