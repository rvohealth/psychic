import { jest } from '@jest/globals'
import RunMigration from 'src/migrate/operation/run'
import db from 'src/db'
import config from 'src/config'

let runMigrations = new RunMigration()
const upSpy1 = jest.fn()
const upSpy2 = jest.fn()
const migrations = {
  '01_create_bruisers.js': { up: upSpy1 },
  '02_create_meowmix.js': { up: upSpy2 },
}

describe('RunMigration#run', () => {
  beforeEach(async () => {
    await db.createTable('migrations', t => {
      t.string('name')
      t.timestamp('created_at')
    })

    jest.spyOn(config, 'schema', 'get').mockReturnValue({
      migrations: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        name: {
          type: 'string',
          name: 'name',
        },
        created_at: {
          type: 'timestamp',
          name: 'created_at',
        },
      },
    })

  })

  it ('responds to step argument', async () => {
    jest.clearAllMocks()
    jest.spyOn(runMigrations, 'migrations').mockReturnValue(migrations)
    jest.spyOn(db, 'insert').mockReturnValue({})

    await runMigrations.run({ step: 1 })

    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(db.insert).toHaveBeenCalledWith('migrations', [{ name: '01_create_bruisers.js' }])
    expect(db.insert).not.toHaveBeenCalledWith('migrations', [{ name: '02_create_meowmix.js' }])
  })
})
