export default async function rebootApp() {
  const messagesConfig = await loadYaml('tmp/integrationtestapp/config/messages')
  const dbConfig = await loadYaml('tmp/integrationtestapp/config/database')
  const redisConfig = await loadYaml('tmp/integrationtestapp/config/redis')
  const telekinesisConfig = await loadYaml('tmp/integrationtestapp/config/telekinesis')
  const ghostsConfig = await loadYaml('tmp/integrationtestapp/config/ghosts')
  const pathsConfig = await loadYaml('tmp/integrationtestapp/config/paths')
  const packagedDreams = await import('tmp/integrationtestapp/.dist/app/pkg/dreams.pkg.js')
  const packagedChannels = await import('tmp/integrationtestapp/.dist/app/pkg/channels.pkg.js')
  const packagedProjections = await import('tmp/integrationtestapp/.dist/app/pkg/projections.pkg.js')
  const routeCB = await import('tmp/integrationtestapp/.dist/config/routes.js')
  const dbSeedCB = await import('tmp/integrationtestapp/.dist/db/seed.js')
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
