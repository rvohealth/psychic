import psychic, { CLI } from 'psychic'
import packagedDreams from 'app/pkg/dreams.pkg'
import packagedChannels from 'app/pkg/channels.pkg'
import packagedProjections from 'app/pkg/projections.pkg'
import redisConfig from 'config/redis.json'
import dbConfig from 'config/database.json'
import routeCB from 'config/routes'
import dbSeedCB from 'db/seed'

async function runCLI() {
  const messagesConfig = await loadYaml('dist/config/messages')

  psychic.boot({
    dreams: packagedDreams,
    channels: packagedChannels,
    projections: packagedProjections,
    dbConfig,
    dbSeedCB,
    redisConfig,
    routeCB,
    messagesConfig,
  })

  const cli = new CLI()
  await cli.run()
}

runCLI()
