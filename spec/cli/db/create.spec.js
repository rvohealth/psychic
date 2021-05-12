import db from 'src/db'
import DBCLIProgram from 'src/cli/program/db'

const dbCLIProgram = new DBCLIProgram()
describe('cli program db:create', () => {
  it ('creates the database, building out the migrations table as well', async () => {
    expect(await db.tableExists('migrations')).toBe(false)
    await dbCLIProgram.create()
    expect(await db.tableExists('migrations')).toBe(true)
  })
})

