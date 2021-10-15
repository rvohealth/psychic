import chalk from 'chalk'
import fs from 'fs'
import CLI from './index.js'
import config from 'src/config'
import l from 'src/singletons/l'
import File from 'src/helpers/file'
import 'src/psychic/boot/globals/all'

async function runCLI() {
  const pkgjson = JSON.parse((await File.read('package.json')))
  const version = pkgjson.version

  const ascii = fs
    .readFileSync(`${config.psychicPath}src/psychic/boot/ascii/small.txt`)
    .toString()
    .replace(/\n$/, '')

  l.logPermanently(chalk.magenta(ascii))
  l.logPermanently(
    "\n " +
      chalk.magenta('psychic') +
      chalk.bgBlack.white(` version ${chalk.green(version)} `) +
      "\n"
  )

  const cli = new CLI()
  await cli.run()
}

runCLI()
