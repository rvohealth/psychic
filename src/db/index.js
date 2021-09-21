import PostgresAdapter from 'src/db/adapter/postgres'
import DBTableOperations from 'src/db/operations/table'
import Query from 'src/db/query'
import CreateTableStatement from 'src/db/statement/table/create'

class DB {
  get adapter() {
    // eventually we will have options here.
    // dry this up with base operations base class
    return new PostgresAdapter()
  }

  get table() {
    return new DBTableOperations()
  }

  async addColumn(tableName, columnName, dataType, constraints) {
    return await this.adapter.addColumn(tableName, columnName, dataType, constraints)
  }

  async changeDefault(tableName, columnName, newDefault) {
    return await this.adapter.changeDefault(tableName, columnName, newDefault)
  }

  async closeConnection() {
    return await this.adapter.closeConnection()
  }

  async columnInfo(tableName, columnName) {
    return await this.adapter.columnInfo(tableName, columnName)
  }

  count(tableName) {
    return new Query()
      .select('count(*)')
      .from(tableName)
  }

  async create() {
    return await this.adapter.createDB()
  }

  async createIfNotExists() {
    try {
      return await this.adapter.createDB()
    } catch (error) {
      // do nothing intentionally
    }
  }

  async createTable(tableName, cb) {
    const statement = CreateTableStatement.new(tableName)

    if (cb)
      cb(statement)

    return await this.adapter.createTable(tableName, statement.columns)
  }

  async createMigrationsIfNotExists() {
    return await this.adapter.createMigrationsIfNotExists()
  }

  delete(tableName) {
    return Query.new().delete(tableName)
  }

  async drop() {
    return await this.adapter.dropDB()
  }

  async dropColumn(tableName, columnName) {
    return await this.adapter.dropColumn(tableName, columnName)
  }

  async dropTable(tableName) {
    return await this.adapter.dropTable(tableName)
  }

  async dropAllTables() {
    return await this.adapter.dropAllTables()
  }

  async hasColumn(tableName, columnName) {
    return await this.adapter.hasColumn(tableName, columnName)
  }

  async insert(tableName, rows) {
    return await this.adapter.insert(tableName, rows)
  }

  async renameColumn(tableName, columnName, newColumnName) {
    return await this.adapter.renameColumn(tableName, columnName, newColumnName)
  }

  async renameTable(tableName, newTableName) {
    return await this.adapter.renameTable(tableName, newTableName)
  }

  select(...fields) {
    return new Query().select(...fields)
  }

  async tableExists(tableName) {
    return await this.adapter.tableExists(tableName)
  }

  async transaction(cb) {
    return await this.adapter.transaction(cb)
  }

  update(tableName, fields) {
    return new Query().update(tableName, fields)
  }
}

export default DB
