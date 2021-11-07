import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('applies array constraint', async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'zombo', array: true }])
    expect(await postgres.hasColumn('users', 'zombo')).toBe(true)

    const info = await postgres.columnInfo('users', 'zombo')

    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'ARRAY',
    }))
  })
})

