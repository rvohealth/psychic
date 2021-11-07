const DBConfigProvider = superclass => class extends superclass {
  get db() {
    return this._db
  }

  get dbDefaultPrecision() {
    return 10
  }

  get dbDefaultScale() {
    return 2
  }

  get dbIdField() {
    return 'id'
  }

  get dbName() {
    return this.db[this.env]?.name
  }

  get dbPassword() {
    return this.db[this.env]?.password
  }

  get dbPort() {
    return this.db[this.env]?.port
  }

  get dbHost() {
    return this.db[this.env]?.host
  }

  get dbUsername() {
    return this.db[this.env]?.username
  }

  get dbIdType() {
    return 'int'
  }

  get dbSeedCB() {
    return this._dbSeedCB
  }

  columnType(tableName, columnName) {
    const columnSchema = this.columnSchema(tableName, columnName)
    return columnSchema?.type
  }

  columnSchema(tableName, columnName) {
    // errors!
    return this.tableSchema(tableName).columns[columnName]
  }

  tableSchema(name) {
    const tabelized = name.pluralize().snakeify()
    if (!this.schema[tabelized]) throw `unrecognized table ${tabelized}`

    return {
      name: tabelized,
      columns: this.schema[tabelized],
    }
  }
}

export default DBConfigProvider

