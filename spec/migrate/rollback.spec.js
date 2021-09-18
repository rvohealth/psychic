import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import RollbackMigration from 'src/migrate/operation/rollback'

describe ('Migrate#rollback', () => {
  it ('calls RollbackMigrations#rollback', () => {
    const spy = jest.spyOn(RollbackMigration.prototype, 'rollback').mockReturnValue({})
    Migrate.rollback()
    expect(spy).toHaveBeenCalled()
  })
})
