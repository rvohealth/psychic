import InverseMigration from 'src/migrate/inverse-migration'
import db from 'src/db'

let migrate = new InverseMigration()
const cb = t => {
  t.string('email')
}

describe('InverseMigration#table#create', () => {
  it ('passes statements along to database layer for processing', async () => {
    const spy = posess(db, 'dropTable').returning({})
    await migrate.createTable('hamncheese', cb)
    expect(spy).toHaveBeenCalledWith('hamncheese')
  })
})
