import InverseMigration from 'src/migrate/inverse-migration'
import CannotFindInverseStatementError from 'src/error/db/migration/cannot-find-inverse-statement'

let migrate = new InverseMigration()

describe('InverseMigration#dropColumn', () => {
  it ('passes along to db', async () => {
    expect(async () => {
      await migrate.dropColumn('hamncheese', 'fishman', 1)
    }).toThrowAsync(CannotFindInverseStatementError)
  })
})
