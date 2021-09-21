import db from 'src/singletons/db'
import Migration from 'src/migrate/migration'
import MigrateOperation from 'src/migrate/operation'

export default class RollbackMigration extends MigrateOperation {
  async rollback({ step }={}) {
    step ||= 1
    const migrations = await this.migrations()
    const files = Object.keys(migrations)

    const migrationsAlreadyRun = []
    for (const fileName of files) {
      const migration = migrations[fileName]
      const alreadyRun = await this.migrationAlreadyRun(fileName)

      if (!alreadyRun && migrationsAlreadyRun.length)
        break
      else
        migrationsAlreadyRun.push({
          ...migration,
          name: fileName,
        })
    }

    await this.rollbackMigrations(migrationsAlreadyRun.splice(
      migrationsAlreadyRun.length - step,
      migrationsAlreadyRun.length
    ))
    return true
  }

  async rollbackMigrations(migrations) {
    for (const alreadyRunMigration of migrations) {
      await alreadyRunMigration.down(new Migration())
      await db
        .delete('migrations')
        .where({ name: alreadyRunMigration.name })
        .do()
    }
  }
}

