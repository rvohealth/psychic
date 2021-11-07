import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  it ('adds numeric column to table', async () => {
    await postgres.createTable('users', [{ type: 'numeric', name: 'zombo' }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'numeric',
      numeric_precision: null,
      numeric_scale: null,
    }))
  })

  it ('accepts precision argument', async () => {
    await postgres.createTable('users', [{ type: 'numeric', name: 'zombo', precision: 10 }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'numeric',
      numeric_precision: 10,
      numeric_scale: 0,
    }))
  })

  it ('accepts scale argument', async () => {
    await postgres.createTable('users', [{ type: 'numeric', name: 'zombo', precision: 20, scale: 10 }])
    const info = await postgres.columnInfo('users', 'zombo')
    expect(info).toEqual(expect.objectContaining({
      column_name: 'zombo',
      data_type: 'numeric',
      numeric_precision: 20,
      numeric_scale: 10,
    }))
  })
})
