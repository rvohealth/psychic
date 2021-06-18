import psychic from 'dist'

// this is all packaged with the for-specs.js makefile
import packagedDreams from 'dist/app/pkg/dreams.pkg.js'
import packagedChannels from 'dist/app/pkg/channels.pkg.js'
import packagedProjections from 'dist/app/pkg/projections.pkg.js'
import redisConfig from 'dist/config/redis.json'
import routeCB from 'dist/config/routes.js'
import dbSeedCB from 'dist/db/seed.js'

// error handling
const {
  className,
  methodName,
  args,
  approach,
  isDream,
  dreamId,
  constructorArgs,
} = JSON.parse(process.argv[2])

psychic.boot({
  dreams: packagedDreams,
  channels: packagedChannels,
  projections: packagedProjections,
  dbSeedCB,
  redisConfig,
  routeCB,
})

const klass = lookup(className)

async function _apply() {
  let dream
  switch(approach) {
  case 'static':
    if (typeof klass[methodName] !== 'function')
      throw `${methodName} is not a static method of class: ${klass}`

    console.log(`RUNNING: ${className}.${methodName}(${args.join(', ')})`)
    return await klass[methodName].apply(klass, args)

  case 'instance':
    if (isDream && dreamId !== null && dreamId !== undefined) {
      dream = await klass.find(dreamId)
      console.log(`RUNNING: ${className}(:${dreamId})#${methodName}(${args.join(', ')})`)
      return await dream[methodName].apply(dream, args)

    } else {
      console.log(`RUNNING: ${className}(:${args.join(', ')})#${methodName}(${args.join(', ')})`)
      const instance = new klass(constructorArgs)
      return await instance[methodName].apply(instance, args)
    }

  case 'annonymous':
    break

  default:
    throw `Undefined approach in call-in-background worker`
  }

}

_apply()
  .then((...results) => {
    console.log('DONE', results)
  })
  .catch(error => {
    console.log('ERRRORRRR', error)
  })
