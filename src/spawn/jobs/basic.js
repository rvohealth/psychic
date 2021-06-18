import psychic from 'dist'
console.log('LOADED ME', process.argv)
const cbStr = process.argv[2]
const args = process.argv.slice(3)

import packagedDreams from 'dist/pkg/dreams.pkg.js'
import packagedChannels from 'dist/pkg/channels.pkg.js'
// import packagedProjections from 'dist/pkg/projections.pkg.js'
// import redisConfig from 'dist/template/config/redis.js'
// import routeCB from 'dist/template/config/routes.js'
// import dbSeedCB from 'dist/template/db/seed.js'
// import packagedDreams from 'dist/app/pkg/dreams.pkg.js'
// import packagedChannels from 'dist/app/pkg/channels.pkg.js'
// import packagedProjections from 'dist/app/pkg/projections.pkg.js'
// import redisConfig from 'dist/config/redis.js'
// import routeCB from 'dist/config/routes.js'
// import dbSeedCB from 'dist/db/seed.js'

// psychic.boot({
//   dreams: packagedDreams,
//   channels: packagedChannels,
//   projections: packagedProjections,
//   dbSeedCB,
//   redisConfig,
//   routeCB,
// })
console.log(psychic)
// const cb = new Function('return ' + cbStr)()
// cb.apply(null, args)
