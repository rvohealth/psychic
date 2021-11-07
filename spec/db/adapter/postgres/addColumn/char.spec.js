import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#addColumn', () => {
  beforeEach(async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'email' }])
    expect(await postgres.hasColumn('users', 'zombo')).toBe(false)
  })

  it ('adds char column to table', async () => {
    await postgres.addColumn('users', 'zombo', 'char')
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'character',
      character_maximum_length: 1,
    }))
  })

  it ('respects size constraint', async () => {
    await postgres.addColumn('users', 'zombo', 'char', { size: 50 })
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'character',
      character_maximum_length: 50,
    }))
  })
})
