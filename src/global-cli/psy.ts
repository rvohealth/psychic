#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import newPsychicApp from './helpers/newPsychicApp'

const program = new Command()

program
  .command('new')
  .description('create a new psychic app')
  .argument('<name>', 'name of the app you want to create')
  .option(
    '--redis',
    "allow redis (i.e. --redis, or --redis false). If you don't set this, you will be prompted on whether or not to enable this.",
  )
  .option(
    '--ws',
    "allow websockets (i.e. --ws, or --ws false) If you don't set this, you will be prompted on whether or not to enable this. Only enable this if redis is also enabled",
  )
  .option(
    '--primaryKey',
    "the type of primary key to use. valid options are: 'bigserial', 'bigint', 'integer', 'uuid' (i.e. --primaryKey uuid)",
  )
  .option(
    '--client',
    "the type of client to use. valid options are: 'react', 'vue', 'nuxt', 'none' (i.e. --client none)",
  )
  .action(async () => {
    const name = program.args[1]
    const args = program.args.slice(2)
    await newPsychicApp(name, args)
  })

program.parse()
