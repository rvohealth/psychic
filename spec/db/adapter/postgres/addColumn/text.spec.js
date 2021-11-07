import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#addColumn', () => {
  beforeEach(async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'email' }])
    expect(await postgres.hasColumn('users', 'zombo')).toBe(false)
  })

  it ('adds column to table', async () => {
    await postgres.addColumn('users', 'zombo', 'text')
    expect(await postgres.hasColumn('users', 'zombo')).toBe(true)

    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'text',
      column_default: null
    }))
  })

  it ('applies array constraint', async () => {
    await postgres.addColumn('users', 'zombo', 'text', { array: true })
    expect(await postgres.hasColumn('users', 'zombo')).toBe(true)

    const info = await postgres.columnInfo('users', 'zombo')

    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'ARRAY',
    }))
  })
})

