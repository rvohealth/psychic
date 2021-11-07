import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#createTable', () => {
  beforeEach(async () => {
    expect(await postgres.hasColumn('users', 'zombo')).toBe(false)
    const preinfo = await postgres.indexes('users')
    expect(preinfo).toEqual([])
  })

  it ('applies index constraint', async () => {
    await postgres.createTable(
      'users',
      [
        { type: 'int', name: 'id', index: true },
      ]
    )
    const info = await postgres.indexes('users')
    expect(info.first).toEqual(expect.objectContaining({
      schemaname: 'public',
      tablename: 'users',
      indexname: 'index_users_on_id',
      indexdef: 'CREATE INDEX index_users_on_id ON public.users USING btree (id)'
    }))
  })

  context ('index is an array', () => {
    it ('expects all items in array to be passed as part of index', async () => {
      await postgres.createTable(
        'users',
        [
          { type: 'int', name: 'id' },
          { type: 'string', name: 'name' },
          { type: 'string', name: 'email', index: ['id', 'name'] },
        ]
      )
      const info = await postgres.indexes('users')
      expect(info.first).toEqual(expect.objectContaining({
        schemaname: 'public',
        tablename: 'users',
        indexname: 'index_users_on_email_and_id_and_name',
        indexdef: 'CREATE INDEX index_users_on_email_and_id_and_name ON public.users USING btree (email, id, name)'
      }))
    })
  })

  context ('index is an an object', () => {
    it ('deconstructs object and assigns attributes to index', async () => {
      await postgres.createTable(
        'users',
        [
          { type: 'int', name: 'id' },
          { type: 'string', name: 'name' },
          { type: 'string', name: 'email', index: {
            name: 'my_index',
            columns: ['name', 'id'],
            unique: true,
          } },
        ]
      )
      const info = await postgres.indexes('users')
      expect(info.first).toEqual(expect.objectContaining({
        schemaname: 'public',
        tablename: 'users',
        indexname: 'my_index',
        indexdef: 'CREATE UNIQUE INDEX my_index ON public.users USING btree (email, name, id)'
      }))
    })
  })
})

