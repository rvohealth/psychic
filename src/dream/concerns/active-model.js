import pluralize from 'pluralize'
import snakeCase from 'src/helpers/snakeCase'
import config from 'src/config'

const ActiveModelProvider = superclass => class extends superclass {
  static get columns() {
    return config.schema[this.table]
  }

  static get resourceName() {
    return snakeCase(this.name)
  }

  static get schema() {
    return config.schema[this.table]
  }

  static get table() {
    if (this._table) return this._table
    return pluralize(snakeCase(this.name))
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
