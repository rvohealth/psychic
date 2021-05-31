import fs from 'fs'
import pluralize from 'pluralize'
import snakeCase from 'src/helpers/snakeCase'
import pascalCase from 'src/helpers/pascalCase'

class Config {
  get appRoot() {
    if (fs.existsSync('app'))
      return 'app'
    else
      return `src/template`
  }

  get env() {
    if (process.env.CORE_TEST) return 'test'
    return process.env.NODE_ENV || 'development'
  }

  get root() {
    if (process.env.CORE_TEST) return 'testapp/'
    // temporary
    // if (fs.existsSync('src'))
      return ``

    // return 'node_modules/psychic/'
    // throw 'NEED TO HANDLE REAL CASE'
  }

  get psychicPath() {
    if (!fs.existsSync('app')) return ''
    return 'node_modules/psychic/'
  }

  get version() {
    return '0.0.0'
  }

  get dbConfig() {
    if (process.env.CORE_TEST) return { test: { name: 'psychic_core_test' } }

    if (!this._dbConfig && fs.existsSync('../../../../config/database.json'))
      this._dbConfig = fs.readFileSync('../../../../config/database.json')

    if (!this._dbConfig)
      this._dbConfig = {
        development: {
          name: 'psychic_core_development',
        }
      }

    return this._dbConfig
  }

  get dbName() {
    return this.dbConfig[this.env].name
  }

  get dbIdType() {
    return 'int'
  }

  get port() {
    return process.env.PSYCHIC_PORT || 777
  }

  get schemaPath() {
    if (process.env.CORE_TEST) return 'tmp/spec/schema.json'

    if (!fs.existsSync('app'))
      return `src/template/config/schema.json`

    return `config/schema.json`
  }

  get schema() {
    return JSON.parse(fs.readFileSync(this.schemaPath))
  }

  get channels() {
    return this._channels
  }

  get dreamPath() {
    return `${this.root}dist/dreams`
  }

  get dreams() {
    // if (process.env.CORE_TEST) throw 'Stub this in tests'
    // loaded at boot to prevent circular deps
    return this._dreams
  }

  get projections() {
    return this._projections
  }

  get currentMigrationPath() {
    return 'tmp/migrate/current.json'
  }

  get routeCB() {
    return this._routeCB
  }

  dream(dreamName) {
    return this.dreams[snakeCase(dreamName)]
  }

  projection(projectionName) {
    return this.projections[pascalCase(projectionName)]
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
    const tabelized = snakeCase(pluralize(name))
    if (!this.schema[tabelized]) throw `unrecognized table ${tabelized}`
    return {
      name: tabelized,
      columns: this.schema[tabelized],
    }
  }

  // must be called before app loads!
  boot(dreams, channels, projections, routeCB) {
    this._dreams = dreams
    this._channels = channels
    this._projections = projections
    this._routeCB = routeCB
  }

  constructor() {
    this._dreams = {}
    this._channels = {}
    this._routeCB = null
  }
}

const configSingleton = new Config()
export default configSingleton
