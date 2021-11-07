import PostgresAdapter from 'src/db/adapter/postgres'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#addColumn', () => {
  beforeEach(async () => {
    await postgres.createTable(
      'users',
      [
        { type: 'int', name: 'id' },
        { type: 'text', name: 'email' },
        { type: 'text', name: 'name' },
      ]
    )
    expect(await postgres.hasColumn('users', 'zombo')).toBe(false)
    const preinfo = await postgres.indexes('users')
    expect(preinfo).toEqual([])
  })

  it ('applies index constraint', async () => {
    await postgres.addColumn('users', 'zombo', 'text', { index: true })
    const info = await postgres.indexes('users')
    expect(info.first).toEqual(expect.objectContaining({
      schemaname: 'public',
      tablename: 'users',
      indexname: 'index_users_on_zombo',
      indexdef: 'CREATE INDEX index_users_on_zombo ON public.users USING btree (zombo)'
    }))
  })

  context ('index is an array', () => {
    it ('expects all items in array to be passed as part of index', async () => {
      await postgres.addColumn('users', 'zombo', 'text', { index: ['email', 'id']})
      const info = await postgres.indexes('users')
      expect(info.first).toEqual(expect.objectContaining({
        schemaname: 'public',
        tablename: 'users',
        indexname: 'index_users_on_zombo_and_email_and_id',
        indexdef: "CREATE INDEX index_users_on_zombo_and_email_and_id ON public.users USING btree (zombo, email, id)",
      }))
    })
  })

  context ('index is an an object', () => {
    it ('deconstructs object and assigns attributes to index', async () => {
      await postgres.addColumn('users', 'zombo', 'text', {
        index: {
          columns: ['email', 'name'],
          unique: true,
          name: 'my_index',
        }
      })
      const info = await postgres.indexes('users')
      expect(info.first).toEqual(expect.objectContaining({
        schemaname: 'public',
        tablename: 'users',
        indexname: 'my_index',
        indexdef: "CREATE UNIQUE INDEX my_index ON public.users USING btree (zombo, email, name)",
      }))
    })
  })
})

