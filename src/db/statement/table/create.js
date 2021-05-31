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

  array(columnName, datatype) {
    this.columns.push({
      type: 'array',
      name: columnName,
      datatype,
    })
  }

  bool(columnName) {
    this.columns.push({
      type: 'boolean',
      name: columnName,
    })
  }

  char(columnName) {
    this.columns.push({
      type: 'char',
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

  uuid(columnName) {
    this.columns.push({
      type: 'uuid',
      name: columnName,
    })
  }

}
