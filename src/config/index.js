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

  get authKeys() {
    return this._authKeys
  }

  get channels() {
    return this._channels
  }

  get cookies() {
    return {
      maxAge: process.env.COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 30, // 30 days
    }
  }

  get dbConfig() {
    if (process.env.CORE_TEST) return { test: { name: 'psychic_core_test' } }

    if (!this._dbConfig && fs.existsSync('config/database.json'))
      this._dbConfig = JSON.parse(fs.readFileSync('config/database.json'))

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

  get dbSeedCB() {
    return this._dbSeedCB
  }

  get dreamPath() {
    return `${this.root}dist/dreams`
  }

  get dreams() {
    // if (process.env.CORE_TEST) throw 'Stub this in tests'
    // loaded at boot to prevent circular deps
    return this._dreams
  }

  get env() {
    if (process.env.CORE_TEST) return 'test'
    return process.env.PSYCHIC_ENV || process.env.NODE_ENV || 'development'
  }

  get frontEndUrl() {
    return 'http://localhost:3000'
  }

  get pkgPath() {
    if (this.env === 'CORE_DEVELOPMENT') return 'src/pkg'
    return 'dist/app/pkg'
  }

  get port() {
    return process.env.PSYCHIC_PORT || 777
  }

  get psychicPath() {
    if (!fs.existsSync('app')) return ''
    return 'node_modules/psychic/'
  }

  get redisConfig() {
    return this._redisConfig
  }

  get redisPort() {
    return this.redisConfig.port || '999'
  }

  get root() {
    if (process.env.CORE_TEST) return 'testapp/'
    return ``
  }

  get schemaPath() {
    if (process.env.CORE_TEST) return 'tmp/spec/schema.json'

    if (!fs.existsSync('app'))
      return `src/template/config/schema.json`

    return `config/schema.json`
  }

  get schema() {
    if (process.env.CORE_TEST) return {} // stub in individual specs
    return JSON.parse(fs.readFileSync(this.schemaPath))
  }

  get version() {
    return '0.0.0'
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

  get wssPort() {
    return process.env.PSYCHIC_WSS_PORT || 778
  }

  get wssUrl() {
    return `ws://localhost:${this.wssPort}/`
  }

  constructor() {
    this._dreams = {}
    this._channels = {}
    this._authKeys = {}
    this._routeCB = null
  }

  // must be called before app loads!
  boot({
    dbSeedCB,
    dreams,
    channels,
    redisConfig,
    routeCB,
    projections,
  }) {
    this._dbSeedCB = dbSeedCB
    this._dreams = dreams
    this._channels = channels
    this._redisConfig = redisConfig
    this._routeCB = routeCB
    this._projections = projections
  }

  columnType(tableName, columnName) {
    const columnSchema = this.columnSchema(tableName, columnName)
    return columnSchema?.type
  }

  columnSchema(tableName, columnName) {
    // errors!
    return this.tableSchema(tableName).columns[columnName]
  }

  dream(dreamName) {
    const dream = this.dreams[snakeCase(dreamName)]
    return dream.default || dream
  }

  projection(projectionName) {
    return this.projections[pascalCase(projectionName)]
  }

  registerAuthKey(authKey, route) {
    this._authKeys[authKey] = route
  }

  tableSchema(name) {
    const tabelized = snakeCase(pluralize(name))
    if (!this.schema[tabelized]) throw `unrecognized table ${tabelized}`
    return {
      name: tabelized,
      columns: this.schema[tabelized],
    }
  }
}

const config = new Config()
export default config
