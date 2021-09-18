import MigrateOperation from 'src/migrate/operation'

export default class RollbackMigration extends MigrateOperation {
  async rollback() {
    const migrations = await this.migrations()
    console.log(migrations)
    const files = Object.keys(migrations)

    let lastMigration
    for (const fileName of files) {
      const migration = migrations[fileName]
      lastMigration = migration
      const alreadyRun = await this.migrationAlreadyRun(fileName)

      if (!alreadyRun) {
        // do rollback logic here
        console.log('LAST MIGRATION: ', lastMigration)
      }
    }

    return true
  }
}

