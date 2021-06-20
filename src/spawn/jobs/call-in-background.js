// a note about this file:
// this is much like schrodinger's cat (sp? who cares.)
// basically, as soon as you log, the script will output that and die.
// this means that you cannot have multiple console logs in this script,
// and as soon as you log, that's it for your script, it will not run any further.
// not sure if this is part of web workers, or part of bree, either way, would love to
// fix, but in the mean time be sparing with console logs here to avoid confusion.

import { parentPort } from 'worker_threads'
import psychic from 'dist'
import l from 'dist/singletons/l'

// this is all packaged with the for-specs.js makefile
import packagedDreams from 'dist/app/pkg/dreams.pkg.js'
import packagedChannels from 'dist/app/pkg/channels.pkg.js'
import packagedProjections from 'dist/app/pkg/projections.pkg.js'
import routeCB from 'dist/config/routes.js'
import dbSeedCB from 'dist/db/seed.js'

// error handling
const {
  jobName,
  className,
  methodName,
  args,
  approach,
  isDream,
  dreamId,
  constructorArgs, // instance only
  cbString, // annonymous function only
} = JSON.parse(process.argv[2])

function cancel() {
  // do cleanup here
  if (parentPort) parentPort.postMessage('cancelled')
  else process.exit(0)
}

function exit() {
  // do cleanup here
  process.exit(0)
}

const klass = lookup(className)

async function _apply() {
  let dream,
    cb

  const messagesConfig = await loadYaml('dist/config/messages')
  const dbConfig = await loadYaml('dist/config/database')
  const redisConfig = await loadYaml('dist/config/redis')
  const telekinesisConfig = await loadYaml('dist/config/telekinesis')

  psychic.boot({
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

  switch(approach) {
  case 'static':
    if (typeof klass[methodName] !== 'function')
      throw `${methodName} is not a static method of class: ${klass}`

    return await klass[methodName].apply(klass, args)

  case 'instance':
    if (isDream && dreamId !== null && dreamId !== undefined) {
      dream = await klass.find(dreamId)
      return await dream[methodName].apply(dream, args)

    } else {
      const instance = new klass(constructorArgs)
      return await instance[methodName].apply(instance, args)
    }

  case 'annonymous':
    cb = new Function('return ' + cbString)()
    return await cb.apply(cb, args)

  default:
    throw `Undefined approach in call-in-background worker`
  }
}

_apply()
  .then((...results) => {
    l.log(`Finished running job ${jobName}: results: ${results}`)
    exit()
  })
  .catch(error => {
    l.error('ERRRORRRR', error)
    exit()
  })

if (parentPort)
  parentPort
    .once('message', message => {
      console.log('CANCELING')
      if (message === 'cancel') return cancel()
    })
