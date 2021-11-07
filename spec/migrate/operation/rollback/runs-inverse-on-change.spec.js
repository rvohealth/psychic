import RollbackMigration from 'src/migrate/operation/rollback'
import db from 'src/db'
import config from 'src/config'
import InverseMigration from 'src/migrate/inverse-migration'

describe('RollbackMigration#rollback', () => {
  let rollbackMigrations = new RollbackMigration()
  const changeSpy1 = eavesdrop()
  const migrations = {
    '01_create_bruisers.js': { change: changeSpy1 },
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
  })

  it ('runs the down function of the migration, assuming step: 1 when not passed explicitly', async () => {
    posess(InverseMigration, 'new').returning({ fish: 10 })
    posess(rollbackMigrations, 'migrations').returning(migrations)
    posess(rollbackMigrations, 'migrationAlreadyRun').returning(true)

    await db.insert('migrations', [{ name: '02_create_meowmix.js' }, { name: '01_create_bruisers.js' }])
    expect(await db.count('migrations').where({ name: '02_create_meowmix.js' }).do()).toBe(1)

    await rollbackMigrations.rollback()
    expect(migrations['01_create_bruisers.js'].change).toHaveBeenCalledWith({ fish: 10 })
  })
})
