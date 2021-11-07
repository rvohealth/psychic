export default class Boot {
  initialize(routePrefix=null) {
    this.routePrefix = routePrefix ?
      routePrefix.replace(/\/$/, '') + '/' :
      ''
  }

  async boot() {
    const messagesConfig = await loadYaml(`${this.routePrefix}config/messages`)
    const dbConfig = await loadYaml(`${this.routePrefix}config/database`)
    const redisConfig = await loadYaml(`${this.routePrefix}config/redis`)
    const telekinesisConfig = await loadYaml(`${this.routePrefix}config/telekinesis`)
    const ghostsConfig = await loadYaml(`${this.routePrefix}config/ghosts`)
    const pathsConfig = await loadYaml(`${this.routePrefix}config/paths`)
    const packagedDreams = await import(`${this.routePrefix}.dist/app/pkg/dreams.pkg.js`)
    const packagedChannels = await import(`${this.routePrefix}.dist/app/pkg/channels.pkg.js`)
    const packagedProjections = await import(`${this.routePrefix}.dist/app/pkg/projections.pkg.js`)
    const routeCB = await import(`${this.routePrefix}.dist/config/routes.js`)
    const dbSeedCB = await import(`${this.routePrefix}.dist/db/seed.js`)
    const config = await import('src/config')

    config.boot({
      dreams: packagedDreams,
      channels: packagedChannels,
      projections: packagedProjections,
      dbConfig,
      dbSeedCB,
      pathsConfig,
      redisConfig,
      routeCB,
      messagesConfig,
      telekinesisConfig,
      ghostsConfig,
    })
  }
}
