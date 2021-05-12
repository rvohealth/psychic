import fs from 'fs'
import migrations from 'src/pkg/migrations.pkg'
import db from 'src/db'
import config from 'src/config'

export default class RunMigration {
  get migrations() {
    return migrations
  }

  async run() {
    await this._beforeAll()

    const files = Object.keys(this.migrations)
    for (const fileName of files) {
      const migration = this.migrations[fileName]
      const alreadyRun = await this._migrationAlreadyRun(fileName)

      this._lockMigration({ fileName, alreadyRun })

      await this._beforeMigration()
      await migration.up()
      await this._afterMigration(fileName, alreadyRun)

      this._unlockMigration()
    }

    // await Promise.all(promises)

    return true
  }

  async _beforeAll() {
    // await db.create()
    await db.createMigrationsIfNotExists()
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
