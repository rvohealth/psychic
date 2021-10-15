import config from 'src/config'

const ActiveModelProvider = superclass => class extends superclass {
  static get columns() {
    return config.schema[this.table]
  }

  static get resourceName() {
    return this.name.snakeify()
  }

  static get schema() {
    return config.schema[this.table]
  }

  static get table() {
    if (this._table) return this._table
    return this.name.snakeify().pluralize()
  }

  static set table(tableName) {
    this._table = tableName
  }

  get isNewRecord() {
    return !this.persisted
  }

  get persisted() {
    return !!this.id
  }

  get resourceName() {
    return this.constructor.resourceName
  }

  get table() {
    return this.constructor.table
  }
}

export default ActiveModelProvider
