import fs from 'fs'
import path from 'path'
import transports from 'src/singletons/transports'
import telekineticBridges from 'src/singletons/telekinetic-bridges'
import ghosts from 'src/ghost/ghosts'

class Config {
  get appRoot() {
    if (fs.existsSync('app'))
      return 'app'
    else
      return `template/psychic-app`
  }

  get authKeys() {
    return this._authKeys
  }

  get channels() {
    return this._channels
  }

  get routesPath() {
    if (process.env.CORE_TEST && !process.env.CORE_INTEGRATION_TEST)
      return 'spec/support/testapp/config/routes'

    return 'config/routes'
  }

  get cookies() {
    return {
      maxAge: process.env.COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 30, // 30 days
    }
  }

  get db() {
    return this._db
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

  get dreamPath() {
    return `${this.root}.dist/dreams`
  }

  get dreams() {
    return this._dreams
  }

  get env() {
    if (ENV.CORE_TEST) return 'test'
    if (process.env.CORE_INTEGRATION_TEST) return 'development'
    return process.env.PSYCHIC_ENV || process.env.NODE_ENV || 'development'
  }

  get frontEndUrl() {
    return 'http://localhost:3000'
  }

  get localStoragePath() {
    if (ENV.CORE_TEST) return 'tmp/storage/spec'
    return 'storage'
  }

  get pkgPath() {
    if (this.env === 'CORE_DEVELOPMENT') return 'src/pkg'
    return '.dist/app/pkg'
  }

  get port() {
    return process.env.PSYCHIC_PORT || 777
  }

  get psychicPath() {
    if (!fs.existsSync('app')) return ''
    return 'node_modules/psychic/'
  }

  get psyJsPath() {
    if (process.env.CORE_INTEGRATION_TEST) return 'src/psy'
    if (process.env.CORE_TEST) return 'tmp/spec/psy'
    return this._paths.psy_js || 'src/psy'
  }

  get redis() {
    return this._redisConfig
  }

  get redisPort() {
    return this.redis.port || '999'
  }

  get redisHost() {
    return this.redis.host || 'localhost'
  }

  get redisDB() {
    return this.redis.db || 0
  }

  get redisPassword() {
    return this.redis.password || ''
  }

  get root() {
    if (process.env.CORE_TEST) return 'spec/support/testapp'
    return ''
  }

  get schemaPath() {
    if (process.env.CORE_TEST) return 'tmp/spec/schema.json'

    if (!fs.existsSync('app'))
      return `template/psychic-app/config/schema.json`

    return `config/schema.json`
  }

  get schema() {
    if (process.env.CORE_TEST) return {} // stub in individual specs
    return JSON.parse(fs.readFileSync(this.schemaPath))
  }

  get messages() {
    return this._messagesConfig
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

  get telekinesisConfig() {
    if (!this._telekinesisConfig) console.trace()
    if (!this._telekinesisConfig) throw `config not booted yet`
    return this._telekinesisConfig[this.env]
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
    dbConfig,
    dbSeedCB,
    dreams,
    channels,
    pathsConfig,
    redisConfig,
    routeCB,
    projections,
    messagesConfig,
    telekinesisConfig,
    ghostsConfig,
  }) {
    this._db = dbConfig,
    this._dbSeedCB = dbSeedCB
    this._dreams = dreams
    this._channels = channels
    this._redisConfig = redisConfig
    this._routeCB = routeCB
    this._projections = projections
    this._messagesConfig = messagesConfig
    this._telekinesisConfig = telekinesisConfig
    this._ghostsConfig = ghostsConfig
    this._pathsConfig = pathsConfig

    transports.setConfig(messagesConfig)
    telekineticBridges.setConfig(telekinesisConfig[this.env])
    ghosts.setConfig(ghostsConfig)
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
    const dream = this.dreams[dreamName.snakeify()]
    return dream?.default || dream
  }

  lookup(className) {
    return this.dream(className)
  }

  pathTo(file) {
    return path.join(this.root, file)
  }

  projection(projectionName) {
    return this.projections[projectionName.pascalize()]
  }

  registerAuthKey(authKey, route) {
    this._authKeys[authKey] = route
  }

  tableSchema(name) {
    const tabelized = name.pluralize().snakeify()
    if (!this.schema[tabelized]) throw `unrecognized table ${tabelized}`

    return {
      name: tabelized,
      columns: this.schema[tabelized],
    }
  }

  telekinesisConfigFor(key) {
    return this.telekinesisConfig[key]
  }
}

const config = global.__psychic__config || new Config()
global.__psychic__config = config

export default config
