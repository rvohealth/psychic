import fs from 'fs'
import db from 'src/db'
import config from 'src/singletons/config'

class MigrateOperation {
  async migrationAlreadyRun(fileName) {
    const response = await db
      .select('*')
      .from('migrations')
      .where({ name: fileName })
      .do()
    return !!response.length
  }

  async migrations() {
    return (await import(config.pkgPath + '/migrations.pkg')).default
  }

  lockMigration(migrationData) {
    fs.writeFileSync(config.currentMigrationPath, JSON.stringify(migrationData))
  }

  unlockMigration() {
    fs.unlinkSync(config.currentMigrationPath)
  }
}

export default MigrateOperation
