import fs from 'fs'
// import migrations from 'src/pkg/migrations.pkg'
import db from 'src/db'
import config from 'src/config'
import Migration from 'src/migrate'
import CreateTableStatement from 'src/db/statement/table/create'

export default class RunMigration {
  async migrations() {
    return (await import(config.pkgPath + '/migrations.pkg')).default
  }

  async run() {
    await this._beforeAll()
    const migrations = await this.migrations()

    const files = Object.keys(migrations)
    for (const fileName of files) {
      const migration = migrations[fileName]
      const alreadyRun = await this._migrationAlreadyRun(fileName)

      this._lockMigration({ fileName, alreadyRun })

      await this._beforeMigration()
      await migration.up(new Migration())
      await this._afterMigration(fileName, alreadyRun)

      this._unlockMigration()
    }

    return true
  }

  async _beforeAll() {
    // await db.create()
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
    // await db.createMigrationsIfNotExists()
  }

  async _beforeMigration() {
    return true
  }

  async _afterMigration(name, alreadyRun) {
    if (!alreadyRun)
      await db.insert('migrations', [{ name }])

    return true
  }

  async _migrationAlreadyRun(fileName) {
    const response = await db
      .select('*')
      .from('migrations')
      .where({ name: fileName })
      .do()
    return !!response.length
  }

  _lockMigration(migrationData) {
    fs.writeFileSync(config.currentMigrationPath, JSON.stringify(migrationData))
  }

  _unlockMigration() {
    fs.unlinkSync(config.currentMigrationPath)
  }
}
