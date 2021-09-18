import RunMigration from 'src/migrate/operation/run'
import RollbackMigration from 'src/migrate/operation/rollback'

class Migrate {
  static async run() {
    await new RunMigration().run()
  }

  static async rollback() {
    await new RollbackMigration().rollback()
  }
}

export default Migrate
