import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('adds double-precision column to table', async () => {
    await postgres.createTable('users', [{ type: 'double', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'double precision',
    }))
  })
})
