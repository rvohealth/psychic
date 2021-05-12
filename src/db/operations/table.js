import DBOperations from 'src/db/operations'

export default class DBTableOperations extends DBOperations {
  count(name) {
    return this.adapter.count(name)
  }

  create(name, cb) {
    return this.adapter.createTable(name, cb)
  }

  createMigrationsIfNotExists() {
    return this.adapter.createMigrationsIfNotExists()
  }

  drop(tableName) {
    return this.adapter.dropTable(tableName)
  }

  dropAll() {
    return this.adapter.dropAllTables()
  }

  exists(tableName) {
    return this.adapter.tableExists(tableName)
  }

  insert(tableName, rows) {
    return this.adapter.insert(tableName, rows)
  }
}
