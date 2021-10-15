import fs from 'fs'
import '.dist/psychic/boot/globals/repl'
import '.dist/psychic/boot/all'
import '.dist/app/pkg/repl.pkg'
import dbSeedCB from '.dist/db/seed'
import config from 'src/config'
import packagedDreams from '.dist/app/pkg/dreams.pkg'
import packagedChannels from '.dist/app/pkg/channels.pkg'
import packagedProjections from '.dist/app/pkg/projections.pkg'
import routeCB from '.dist/config/routes'

async function loadRepl() {
  const ascii = fs.readFileSync(`${config.psychicPath}src/psychic/boot/ascii.txt`).toString()
  const messagesConfig = await loadYaml('.dist/config/messages')
  const dbConfig = await loadYaml('.dist/config/database')
  const redisConfig = await loadYaml('.dist/config/redis')
  const telekinesisConfig = await loadYaml('.dist/config/telekinesis')

  config.boot({
    dreams: packagedDreams,
    channels: packagedChannels,
    projections: packagedProjections,
    dbConfig,
    dbSeedCB,
    redisConfig,
    routeCB,
    messagesConfig,
    telekinesisConfig,
  })

  console.log(ascii)
  console.log(`-------------------`)
  console.log('psychic version 0.0')
  console.log(`-------------------`)
}

loadRepl()
