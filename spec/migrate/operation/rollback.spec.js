import { jest } from '@jest/globals'
import RollbackMigration from 'src/migrate/operation/rollback'
import db from 'src/db'
import config from 'src/config'

let rollbackMigrations = new RollbackMigration()
const downSpy1 = jest.fn()
const downSpy2 = jest.fn()
const migrations = {
  '01_create_bruisers.js': { down: downSpy1 },
  '02_create_meowmix.js': { down: downSpy2 },
}

describe('RollbackMigration#rollback', () => {
  beforeEach(async () => {
    await db.createTable('migrations', t => {
      t.string('name')
      t.timestamp('created_at')
    })

    spy(config, 'schema', 'get').returning({
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
    spy(rollbackMigrations, 'migrations').returning(migrations)
    spy(rollbackMigrations, 'migrationAlreadyRun').returning(true)

    await db.insert('migrations', [{ name: '02_create_meowmix.js' }, { name: '01_create_bruisers.js' }])
    expect(await db.count('migrations').where({ name: '02_create_meowmix.js' }).do()).toBe(1)

    await rollbackMigrations.rollback()
    expect(migrations['02_create_meowmix.js'].down).toHaveBeenCalled()
    expect(migrations['01_create_bruisers.js'].down).not.toHaveBeenCalled()

    expect(await db.count('migrations').where({ name: '02_create_meowmix.js' }).do()).toBe(0)
  })

  context ('step: 2 is passed', () => {
    it ('runs the down function of both migrations, assuming step: 1 when not passed explicitly', async () => {
      await db.insert('migrations', [{ name: '02_create_meowmix.js' }, { name: '01_create_bruisers.js' }])
      expect(await db.count('migrations').do()).toBe(2)

      spy(rollbackMigrations, 'migrations').returning(migrations)
      spy(rollbackMigrations, 'migrationAlreadyRun').returning(true)

      await rollbackMigrations.rollback({ step: 2 })
      expect(migrations['02_create_meowmix.js'].down).toHaveBeenCalled()
      expect(migrations['01_create_bruisers.js'].down).toHaveBeenCalled()
      expect(await db.count('migrations').do()).toBe(0)
    })
  })
})
