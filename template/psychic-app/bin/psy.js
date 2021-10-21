import psychic, { CLI } from 'psychic'
import packagedDreams from 'app/pkg/dreams.pkg'
import packagedChannels from 'app/pkg/channels.pkg'
import packagedProjections from 'app/pkg/projections.pkg'
import routeCB from 'config/routes'
import dbSeedCB from 'db/seed'

async function runCLI() {
  const messagesConfig = await loadYaml('.dist/config/messages')
  const dbConfig = await loadYaml('.dist/config/database')
  const redisConfig = await loadYaml('.dist/config/redis')
  const telekinesisConfig = await loadYaml('.dist/config/telekinesis')
  const ghostsConfig = await loadYaml('config/ghosts')
  const pathsConfig = await loadYaml('config/paths')

  psychic.boot({
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

  const cli = new CLI()
  await cli.run()
}

runCLI()
