import config from 'src/config'

export default class CreateTableStatement {
  constructor() {
    this._columns = [{
      type: config.dbIdType,
      name: 'id',
      primary: true,
      unique: true,
    }]
  }

  get columns() {
    return this._columns
  }

  bool(columnName) {
    this.columns.push({
      type: 'boolean',
      name: columnName,
    })
  }

  float(columnName, { length }={}) {
    this.columns.push({
      type: 'float',
      name: columnName,
      length,
    })
  }

  int(columnName, { length }={}) {
    this.columns.push({
      type: 'int',
      name: columnName,
      length,
    })
  }

  string(columnName, { length }={}) {
    this.columns.push({
      type: 'text',
      name: columnName,
      length,
    })
  }

  timestamp(columnName) {
    this.columns.push({
      type: 'timestamp',
      name: columnName,
    })
  }
}
