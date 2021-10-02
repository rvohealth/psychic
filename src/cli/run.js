import chalk from 'chalk'
import fs from 'fs'
import CLI from './index.js'
import config from 'src/config'
import l from 'src/singletons/l'
import 'src/boot/globals/all'

async function runCLI() {
  const ascii = fs.readFileSync(`${config.psychicPath}src/boot/ascii.txt`).toString()
  l.logLiteral(chalk.grey(ascii))

  const cli = new CLI()
  await cli.run()
}

runCLI()
