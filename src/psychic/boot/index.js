import config from 'src/config'

export default class Boot {
  constructor(
    routePrefix=null,
    {
      pkgRoot,
      packagedDreams,
      packagedChannels,
      packagedProjections,
      routeCB,
      dbSeedCB,
    }={}
  ) {
    this.routePrefix = routePrefix ?
      routePrefix.replace(/\/$/, '') + '/' :
      ''

    this.pkgRoot = (pkgRoot || '.dist').replace(/\/$/, '') + '/'
    this.packagedDreams = packagedDreams
    this.packagedChannels = packagedChannels
    this.packagedProjections = packagedProjections
    this.routeCB = routeCB
    this.dbSeedCB = dbSeedCB
  }

  async boot() {
    const messagesConfig = await loadYaml(`${this.routePrefix}config/messages`)
    const dbConfig = await loadYaml(`${this.routePrefix}config/database`)
    const redisConfig = await loadYaml(`${this.routePrefix}config/redis`)
    const telekinesisConfig = await loadYaml(`${this.routePrefix}config/telekinesis`)
    const ghostsConfig = await loadYaml(`${this.routePrefix}config/ghosts`)
    const pathsConfig = await loadYaml(`${this.routePrefix}config/paths`)

    this.packagedDreams ||= (await import(`${this.pkgRoot}app/pkg/dreams.pkg.js`)).default
    this.packagedChannels ||= (await import(`${this.pkgRoot}app/pkg/channels.pkg.js`)).default
    this.packagedProjections ||= (await import(`${this.pkgRoot}app/pkg/projections.pkg.js`)).default
    this.routeCB ||= await (import(`${this.pkgRoot}config/routes.js`)).default
    this.dbSeedCB ||= await (import(`${this.pkgRoot}db/seed.js`)).default

    config.boot({
      dreams: this.packagedDreams,
      channels: this.packagedChannels,
      projections: this.packagedProjections,
      routeCB: this.routeCB,
      dbSeedCB: this.dbSeedCB,
      dbConfig,
      pathsConfig,
      redisConfig,
      messagesConfig,
      telekinesisConfig,
      ghostsConfig,
    })
  }
}
