#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import * as fs from 'fs/promises'
import sspawn from '../src/helpers/sspawn'
import setCoreDevelopmentFlag, { coreSuffix } from './cli/helpers/setCoreDevelopmentFlag'

const program = new Command()

program
  .command('sync:all')
  .description('generates the .psy folder, which is used by psychic to ingest your app')
  .option('--core', 'sets core to true')
  .action(async () => {
    try {
      await fs.stat('./node_modules/dream/test-app')
      console.log('test-app still present in dream installation, removing...')
      await fs.rm('./node_modules/dream/test-app', { recursive: true, force: true })
    } catch (error) {
      // intentionally ignore, since we expect this dir to be empty.
    }

    await sspawn(`yarn psy sync:psydir${coreSuffix(program.args)}`)
    // TODO: figure out why this throws DB error
    // await sspawn(`yarn dream sync:all`)
  })

program
  .command('clean')
  .description('cleans up existing test infrastructure from psychic and dream installations')
  .action(async () => {
    await sspawn(`rm -rf ./node_modules/dream/test-app && rm -rf ./node_modules/psychic/test-app`)
  })

program
  .command('sync:psydir')
  .description('generates the .psy folder, which is used by psychic to ingest your app')
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    const srcDir = coreDevFlag ? './test-app' : '../../src'
    await sspawn(`${coreDevFlag}ts-node ./bin/build-psychic-dir.ts`)
    await sspawn(`yarn build`)
    await sspawn(`${coreDevFlag}ts-node ${srcDir}/.psy/buildGlobals.ts`)
  })

program
  .command('copy:models')
  .description('builds internal index for models')
  .action(async () => {
    await sspawn(`npx ts-node ./.dream/bin/copy-models.ts`)
  })

program
  .command('dream')
  .description('calls to the underlying dream cli')
  .action(async () => {
    await sspawn(`yarn dream ${program.args.slice(1, program.args.length).join(' ')}`)
  })

program
  .alias('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('generate dream <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .action(async () => {
    const [_, name, ...attributes] = program.args
    await sspawn(`yarn dream g:model ${name} ${attributes.join(' ')}`)
  })

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .action(async () => {
    const [_, name] = program.args
    await sspawn(`yarn dream g:migration ${name}`)
  })

program
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .action(async () => {
    await sspawn(`yarn dream db:migrate${coreSuffix(program.args)}`)
  })

program
  .command('sync:types')
  .alias('sync:all')
  .description('runs yarn dream sync:schema, then yarn dream sync:associations')
  .option('--core', 'sets core to true')
  .action(async () => {
    await sspawn(`yarn dream sync:schema${coreSuffix(program.args)}`)
    await sspawn(`yarn dream sync:associations${coreSuffix(program.args)}`)
  })

program
  .command('sync:schema')
  .alias('sync')
  .alias('introspect')
  .description(
    'introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
  )
  .action(async () => {
    await sspawn(`yarn dream sync:schema`)
  })

program
  .command('sync:associations')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .action(async () => {
    await sspawn(`yarn dream sync:associations`)
  })

program
  .command('db:create')
  .description(
    'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .action(async () => {
    await sspawn(`yarn dream db:create`)
  })

program
  .command('db:drop')
  .description(
    'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .action(async () => {
    await sspawn(`yarn dream db:drop`)
  })

program
  .command('spec')
  .description(
    'copies a boilerplate template for schema.ts and dream.ts, which are both provided to the dream framework'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    console.log(program.args)
    // setCoreDevelopmentFlag(program.args)
    // const files = program.args.filter(arg => /\.spec\.ts$/.test(arg))
    // if (process.env.CORE_DEVELOPMENT === '1') {
    //   await sspawn(`yarn dream sync:all --core`)
    //   await sspawn(`CORE_DEVELOPMENT=1 jest --runInBand --forceExit ${files.join(' ')}`)
    // } else {
    //   throw 'this command is not meant for use outside core development'
    // }
  })

program
  .command('console')
  .description('initiates a repl, loading the models from the development test-app into scope for easy use')
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(program.args)
    if (process.env.CORE_DEVELOPMENT === '1') {
      await sspawn(`NODE_ENV=development npx ts-node --project ./tsconfig.json ./test-app/conf/repl.ts`)
    } else {
      await sspawn(`NODE_ENV=development npx ts-node --project ./tsconfig.json ./src/conf/repl.ts`)
    }
  })

program.parse()
