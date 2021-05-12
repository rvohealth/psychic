import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#update with returning', () => {
  it ('respects returning clause', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'james' }])
    await postgres.insert('users', [{ email: 'fishman' }])

    const results = await postgres.update('users', { email: 'jammin' }, { where: { email: 'james' }, returning: ['email']})
    expect(results).toEqual([{email: 'jammin'}])
  })
})

