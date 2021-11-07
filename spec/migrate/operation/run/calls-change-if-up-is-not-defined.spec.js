import RunMigration from 'src/migrate/operation/run'
import Migration from 'src/migrate/migration'
import db from 'src/db'
import config from 'src/config'

describe('RunMigration#run', () => {
  let runMigrations = new RunMigration()
  const changeSpy = eavesdrop()
  const newMigrationStub = { fish: 10 }
  const migrations = {
    '01_create_bruisers.js': { change: changeSpy },
  }

  beforeEach(async () => {
    await db.createTable('migrations', t => {
      t.string('name')
      t.timestamp('created_at')
    })

    posess(config, 'schema', 'get').returning({
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

    posess(Migration, 'new').returning(newMigrationStub)
  })

  it ('calls change if up is not defined', async () => {
    posess(runMigrations, 'migrations').returning(migrations)
    posess(db, 'insert').returning({})

    await runMigrations.run({ step: 1 })
    expect(migrations['01_create_bruisers.js'].change).toHaveBeenCalledWith(newMigrationStub)
  })
})

