import DBCLIProgram from 'src/cli/program/db'
import RunMigration from 'src/migrate/operation/run'

const dbCLIProgram = new DBCLIProgram()

describe('cli program db:migrate', () => {
  it ('calls RunMigration#run', async () => {
    jest.mock('src/migrate/operation/run')
    const runSpy = jest.spyOn(RunMigration.prototype, 'run').mockImplementation(async () => {})
    await dbCLIProgram.migrate()
    expect(runSpy).toHaveBeenCalled()
  })
})

