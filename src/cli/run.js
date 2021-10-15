import chalk from 'chalk'
import fs from 'fs'
import CLI from './index.js'
import config from 'src/config'
import l from 'src/singletons/l'
import 'src/psychic/boot/globals/all'

async function runCLI() {
  const pkgjson = JSON.parse((await File.read('package.json')))
  const version = pkgjson.version
  const ascii = fs.readFileSync(`${config.psychicPath}src/psychic/boot/ascii/small.txt`).toString()
  l.logLiteral(chalk.grey(ascii))
  l.logLiteral(`version ${version}`)

  const cli = new CLI()
  await cli.run()
}

runCLI()
