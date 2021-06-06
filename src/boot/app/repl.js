import fs from 'fs'
import 'dist/boot/globals/repl'
import 'dist/boot/all'
import 'dist/app/pkg/repl.pkg'
import packagedDreams from 'dist/app/pkg/dreams.pkg'
import packagedChannels from 'dist/app/pkg/channels.pkg'
import packagedProjections from 'dist/app/pkg/projections.pkg'
import config from 'src/config'
import routeCB from 'dist/config/routes'

const ascii = fs.readFileSync(`${config.psychicPath}src/boot/ascii.txt`).toString()
config.boot(packagedDreams, packagedChannels, packagedProjections, routeCB)

console.log(ascii)
console.log(`-------------------`)
console.log('psychic version 0.0')
console.log(`-------------------`)
