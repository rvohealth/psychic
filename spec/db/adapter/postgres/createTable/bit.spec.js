import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('adds column to table, defaulting size to 1 bit', async () => {
    await postgres.createTable('users', [{ type: 'bit', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')

    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'bit',
      character_maximum_length: 1,
    }))
  })

  it ('applies size constraint', async () => {
    await postgres.createTable('users', [{ type: 'bit', name: 'zombo', size: 50 }])
    const info = await postgres.columnInfo('users', 'zombo')

    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'bit',
      character_maximum_length: 50,
    }))
  })
})
