import Migration from 'src/migrate/migration'
import db from 'src/db'
import CannotFindInverseStatementError from 'src/error/db/migration/cannot-find-inverse-statement'

export default class InverseMigration extends Migration {
  async addColumn(tableName,) {
    return await db.dropColumn(tableName)
  }

  async changeDefault() {
    throw new CannotFindInverseStatementError('changeDefault')
  }

  async createTable(name) {
    return await db.dropTable(name)
  }

  async dropColumn() {
    throw new CannotFindInverseStatementError('dropColumn')
  }

  async dropTable() {
    throw new CannotFindInverseStatementError('dropTable')
  }

  async insert() {
    throw new CannotFindInverseStatementError('insert')
  }

  async renameColumn() {
    throw new CannotFindInverseStatementError('renameColumn')
  }
}

