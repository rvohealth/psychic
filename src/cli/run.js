#!/usr/bin/env node

import chalk from 'chalk'
import fs from 'fs'
import CLI from './index.js'
import config from 'src/config'
import l from 'src/singletons/l'
import File from 'src/helpers/file'
import 'src/psychic/boot/globals/all'
import 'src/psychic/boot/language-extensions/index'

async function runCLI() {
  const pkgjson = JSON.parse((await File.read('package.json')))
  const version = pkgjson.version

  const ascii = fs
    .readFileSync(`${config.psychicPath}src/psychic/boot/ascii/small.txt`)
    .toString()
    .replace(/\n$/, '')

  l.logPermanently(chalk.bgBlack.white(ascii))
  l.logPermanently(
    " " +
      chalk.magenta('🔮 psychic') +
      chalk.bgBlack.white(` version ${chalk.green(version)} `) +
      "\n"
  )

  const cli = new CLI()
  await cli.run()
}

runCLI()
