import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('sets default to null when not specified', async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'text',
      column_default: null,
    }))
  })

  it ('applies default arg', async () => {
    await postgres.createTable('users', [{ type: 'text', name: 'zombo', default: 'munch' }])
    const info = await postgres.columnInfo('users', 'zombo')

    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'text',
      column_default: "'munch'::text",
    }))
  })
})
