import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('adds smallserial column to table', async () => {
    await postgres.createTable('users', [{ type: 'smallserial', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'smallint',
      column_default: "nextval('users_zombo_seq'::regclass)",
    }))
  })
})
