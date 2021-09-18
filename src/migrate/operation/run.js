// import migrations from 'src/pkg/migrations.pkg'
import db from 'src/db'
import config from 'src/config'
import Migration from 'src/migrate/migration'
import MigrateOperation from 'src/migrate/operation'
import CreateTableStatement from 'src/db/statement/table/create'

export default class RunMigration extends MigrateOperation {
  async migrations() {
    return (await import(config.pkgPath + '/migrations.pkg')).default
  }

  async run({ step }={}) {
    await this._beforeAll()
    const migrations = await this.migrations()

    const files = Object.keys(migrations)
    let numMigrations = 0
    for (const fileName of files) {
      const migration = migrations[fileName]
      const alreadyRun = await this.migrationAlreadyRun(fileName)

      this.lockMigration({ fileName, alreadyRun })

      await this._beforeMigration()

      if (!step || numMigrations < step) {
        await migration.up(new Migration())
        await this._afterMigration(fileName, alreadyRun, { step })
        numMigrations += 1
      }


      this.unlockMigration()
    }

    return true
  }

  async _beforeAll() {
    if (!config.schema.migrations) {
      await db.dropTable('migrations')
      await db.createTable('migrations', t => {
        t.string('name')
        t.timestamp('created_at')
      })

      const statement = new CreateTableStatement('migrations')
      statement.string('name')
      statement.timestamp('created_at')
      new Migration().schema.createTable('migrations', statement.columns)
    }

    if (!config.schema.psychic_storage_records) {
      if ((await db.tableExists('psychic_storage_records')))
        await db.dropTable('psychic_storage_records')

      await db.createTable('psychic_storage_records', t => {
        t.uuid('uuid')
        t.string('name')
        t.string('path')
        t.string('extension')
        t.string('telekinesis_id')
        t.string('telekinesis_key')
        t.string('current_path')
        t.string('current_adapter')
        t.string('current_bucket')
        t.string('adapter')
        t.int('size')
        t.timestamp('created_at')
      })

      const statement = new CreateTableStatement('psychic_storage_records')
      statement.uuid('uuid')
      statement.string('name')
      statement.string('path')
      statement.string('extension')
      statement.string('telekinesis_id')
      statement.string('telekinesis_key')
      statement.string('current_path')
      statement.string('current_adapter')
      statement.string('current_bucket')
      statement.string('adapter')
      statement.int('size')
      statement.timestamp('created_at')
      new Migration().schema.createTable('psychic_storage_records', statement.columns)
    }
  }

  async _beforeMigration() {
    return true
  }

  async _afterMigration(name, alreadyRun) {
    if (!alreadyRun)
      await db.insert('migrations', [{ name }])

    return true
  }
}
