import InverseMigration from 'src/migrate/inverse-migration'
import CannotFindInverseStatementError from 'src/error/db/migration/cannot-find-inverse-statement'

let migrate = new InverseMigration()

describe('InverseMigration#changeDefault', () => {
  it ('raises error', async () => {
    expect(async () => {
      await migrate.changeDefault('hamncheese', 'fishman', 1)
    }).toThrowAsync(CannotFindInverseStatementError)
  })
})
