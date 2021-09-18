import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import RunMigration from 'src/migrate/operation/run'

describe ('Migrate#run', () => {
  it ('calls RunMigrations#run', () => {
    const spy = jest.spyOn(RunMigration.prototype, 'run').mockReturnValue({})
    Migrate.run()
    expect(spy).toHaveBeenCalled()
  })
})
