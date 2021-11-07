import Psyclass from 'src/psychic/psyclass'
import fs from 'fs'
import db from 'src/db'
import CreateTableStatement from 'src/db/statement/table/create'
import SchemaWriter from 'src/migrate/schema-writer'
import config from 'src/config'

export default class Migration extends Psyclass {
  constructor() {
    super()
    this._schema = new SchemaWriter()
  }

  get schema() {
    return this._schema
  }

  get currentMigrationData() {
    if (this._currentMigrationData) return this._currentMigrationData

    if (fs.existsSync(config.currentMigrationPath))
      this._currentMigrationData = JSON.parse(fs.readFileSync(config.currentMigrationPath))
    else
      this._currentMigrationData = {}

    return this._currentMigrationData
  }

  get alreadyRun() {
    return this.currentMigrationData.alreadyRun
  }

  async addColumn(tableName, columnName, type, constraints) {
    return db.addColumn(tableName, columnName, type, constraints)
  }

  async changeDefault(tableName, columnName, newDefault) {
    return db.changeDefault(tableName, columnName, newDefault)
  }

  async createTable(name, cb) {
    const statement = new CreateTableStatement(name)

    if (cb)
      cb(statement)

    this.schema.createTable(name, statement.columns)

    if (!this.alreadyRun)
      await db.createTable(name, cb)

    return true
  }

  async dropColumn(tableName, columnName) {
    return db.dropColumn(tableName, columnName)
  }

  async dropTable(name) {
    return db.dropTable(name)
  }

  async insert(name, rows) {
    return db.insert(name, rows)
  }

  async renameColumn(tableName, columnName, newColumnName) {
    return db.renameColumn(tableName, columnName, newColumnName)
  }

  async _migrationAlreadyRun(fileName) {
    const response = await db
      .select('*')
      .from('migrations')
      .where({ name: fileName })
      .do()
    return !!response.length
  }
}
