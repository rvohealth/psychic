import InverseMigration from 'src/migrate/inverse-migration'
import CannotFindInverseStatementError from 'src/error/db/migration/cannot-find-inverse-statement'

let migrate = new InverseMigration()

describe('InverseMigration#renameColumn', () => {
  it ('passes along to db', async () => {
    expect(async () => {
      await migrate.renameColumn('hamncheese')
    }).toThrowAsync(CannotFindInverseStatementError)
  })
})
