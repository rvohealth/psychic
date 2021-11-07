import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('adds char column to table', async () => {
    await postgres.createTable('users', [{ type: 'char', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'character',
      character_maximum_length: 1,
    }))
  })

  it ('respects size constraint', async () => {
    await postgres.createTable('users', [{ type: 'char', name: 'zombo', size: 50 }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'character',
      character_maximum_length: 50,
    }))
  })
})
