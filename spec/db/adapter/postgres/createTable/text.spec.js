import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('adds text column to table', async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'zombo' }])
    expect(await postgres.hasColumn('users', 'zombo')).toBe(true)

    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'text',
    }))
  })
})

