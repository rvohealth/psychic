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

  it ('passes along to db', async () => {
    jest.spyOn(db, 'insert').mockReturnValue({})
    jest.spyOn(runMigrations, 'migrations').mockReturnValue(migrations)

    await runMigrations.run()
    expect(migrations['01_create_bruisers.js'].up).toHaveBeenCalled()
    expect(migrations['02_create_meowmix.js'].up).toHaveBeenCalled()

    // not sure why we need this, but otherwise it fails.
    expect(db.insert).toHaveBeenCalledWith('migrations', [{ name: '01_create_bruisers.js' }])
    expect(db.insert).toHaveBeenCalledWith('migrations', [{ name: '02_create_meowmix.js' }])
  })
})

