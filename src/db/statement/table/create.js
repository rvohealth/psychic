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

  date(columnName) {
    this.columns.push({
      type: 'date',
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

  hstore(columnName) {
    this.columns.push({
      type: 'hstore',
      name: columnName,
    })
  }

  int(columnName, { length }={}) {
    this.columns.push({
      type: 'int',
      name: columnName,
      length,
    })
  }

  json(columnName) {
    this.columns.push({
      type: 'json',
      name: columnName,
    })
  }

  string(columnName, { length }={}) {
    this.columns.push({
      type: 'text',
      name: columnName,
      length,
    })
  }

  time(columnName) {
    this.columns.push({
      type: 'time',
      name: columnName,
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

  varchar(columnName) {
    this.columns.push({
      type: 'varchar',
      name: columnName,
    })
  }
}
