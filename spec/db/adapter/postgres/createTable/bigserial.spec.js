import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('adds column to table', async () => {
    await postgres.createTable('users', [{ type: 'bigserial', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'bigint',
      is_nullable: 'NO',
      column_default: "nextval('users_zombo_seq'::regclass)",
    }))
  })
})
