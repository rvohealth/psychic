import DBCLIProgram from 'src/cli/program/db'
import RollbackMigration from 'src/migrate/operation/rollback'

const dbCLIProgram = new DBCLIProgram()

describe('cli program db:rollback', () => {
  it ('calls RollbackMigration#run', async () => {
    jest.mock('src/migrate/operation/rollback')
    const rollbackSpy = jest.spyOn(RollbackMigration.prototype, 'rollback').mockImplementation(async () => {})
    await dbCLIProgram.rollback()
    expect(rollbackSpy).toHaveBeenCalled()
  })
})

