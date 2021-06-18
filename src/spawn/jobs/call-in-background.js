import psychic from 'dist'

const payload = JSON.parse(process.argv[2])
const {
  className,
  methodName,
  args
} = payload
// const className = process.argv[2]
// const methodName = process.argv[3]
// const args = process.argv.slice(4)

// this is all packaged with the for-specs.js makefile
import packagedDreams from 'dist/app/pkg/dreams.pkg.js'
import packagedChannels from 'dist/app/pkg/channels.pkg.js'
import packagedProjections from 'dist/app/pkg/projections.pkg.js'
import redisConfig from 'dist/config/redis.json'
import routeCB from 'dist/config/routes.js'
import dbSeedCB from 'dist/db/seed.js'

psychic.boot({
  dreams: packagedDreams,
  channels: packagedChannels,
  projections: packagedProjections,
  dbSeedCB,
  redisConfig,
  routeCB,
})

const klass = lookup(className)

if (typeof klass[methodName] !== 'function')
  throw `${methodName} is not a static method of class: ${klass}`

console.log(`RUNNING: ${className}.${methodName}(${args.join(', ')})`)
async function _apply() {
  return await klass[methodName].apply(klass, args)
}

_apply()
  .then((...results) => {
    console.log('DONE', results)
  })
  .catch(error => {
    console.log('ERRRORRRR', error)
  })
