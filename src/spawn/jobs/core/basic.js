import psychic, { config } from 'dist'
console.log('LOADED ME', process.argv)
const className = process.argv[2]
const methodName = process.argv[3]
const args = process.argv.slice(4)

// this is all packaged with the for-specs.js makefile
import packagedDreams from 'dist/pkg/dreams.pkg.js'
import packagedChannels from 'dist/pkg/channels.pkg.js'
import packagedProjections from 'dist/pkg/projections.pkg.js'
import redisConfig from 'dist/testapp/config/redis.json'
import routeCB from 'dist/testapp/config/routes.js'
import dbSeedCB from 'dist/testapp/db/seed.js'

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

klass[methodName].apply(klass, args)
// console.log(args.slice(2), config.dream('TestUser'))
// const cb = new Function('return ' + cbStr)()
// cb.apply(null, args)
