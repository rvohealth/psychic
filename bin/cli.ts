#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import './cli/loadEnv'
import { Command } from 'commander'
import sspawn from '../src/helpers/sspawn'
import generateResource from '../src/generate/resource'
import setCoreDevelopmentFlag from './cli/helpers/setCoreDevelopmentFlag'
import generateController from '../src/generate/controller'
import hijackRootForCLI from './cli/helpers/hijackRootForCLI'
import yarncmdRunByAppConsumer from './cli/helpers/yarncmdRunByAppConsumer'
import ensureStableAppBuild from './cli/helpers/ensureStableAppBuild'
import omitCoreArg from './cli/helpers/omitCoreArg'

hijackRootForCLI()
const program = new Command()

program
  .command('dream')
  .description('calls to the underlying dream cli')
  .action(async () => {
    const filteredArgs = program.args.slice(1, -1).filter(arg => !['--core'].includes(arg))
    await sspawn(yarncmdRunByAppConsumer(`dream ${filteredArgs.join(' ')}`, omitCoreArg(program.args)))
  })

program
  .command('spec')
  .description('runs all specs if no spec is provided. If a spec is provided, it will run that spec.')
  .option('--fast', 'skips setup')
  .action(async () => {
    await ensureStableAppBuild(program.args)
    const fastFlag = program.args.includes('--fast') ? ':fast' : ''

    const [_, file] = program.args
    if (!file) {
      await sspawn(yarncmdRunByAppConsumer(`uspec${fastFlag}`, program.args))
      await sspawn(yarncmdRunByAppConsumer(`fspec${fastFlag}`, program.args))
    } else if (/spec\/features\//.test(file)) {
      await sspawn(yarncmdRunByAppConsumer(`fspec${fastFlag} ${file}`, program.args))
    } else {
      await sspawn(yarncmdRunByAppConsumer(`uspec${fastFlag} ${file}`, program.args))
    }
  })

program
  .command('clean')
  .description('cleans up existing test infrastructure from psychic and dream installations')
  .action(async () => {
    console.log('cleaning up psychic installation')
    await ensureStableAppBuild(program.args)
  })

program
  .alias('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('generate:model <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .action(async () => {
    await ensureStableAppBuild(program.args)

    const [_, name, ...attributes] = program.args
    await sspawn(
      yarncmdRunByAppConsumer(`dream g:model ${name} ${attributes.join(' ')}`, omitCoreArg(program.args))
    )
  })

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .action(async () => {
    await ensureStableAppBuild(program.args)

    const [_, name] = program.args
    await sspawn(yarncmdRunByAppConsumer(`dream g:model ${name}`, omitCoreArg(program.args)))
  })

program
  .command('generate:resource')
  .alias('g:resource')
  .description(
    'generate:resource <name> [...attributes] create a new dream, migration, controller, and serializer'
  )
  .argument('<route>', 'route path')
  .argument('<modelName>', 'model name')
  .option('--core', 'sets core to true')
  .action(async () => {
    const [_, route, modelName, ...attributes] = program.args
    await generateResource(route, modelName, attributes)
  })

program
  .command('generate:controller')
  .alias('g:controller')
  .description(
    'generate:controller <route> [...methods] create a new controller, autodefining method stubs for passed methods'
  )
  .argument('<route>', 'route path')
  .option('--core', 'sets core to true')
  .action(async () => {
    const [_, route, ...methods] = program.args
    setCoreDevelopmentFlag(program.args)

    await generateController(
      route,
      null,
      methods.filter(method => !['--core'].includes(method))
    )
  })

program
  .command('generate:serializer')
  .alias('g:serializer')
  .description('generate:serializer <name> [...attributes] create a new serializer')
  .argument('<name>', 'name of the migration')
  .option('--core', 'sets core to true')
  .action(async () => {
    await ensureStableAppBuild(program.args)

    const [_, name, ...attributes] = program.args
    await sspawn(
      yarncmdRunByAppConsumer(`dream g:serializer ${name} ${attributes.join(' ')}`, omitCoreArg(program.args))
    )
  })

program
  .command('sync:types')
  .alias('sync:all')
  .description('runs yarn dream sync:schema, then yarn dream sync:associations')
  .option('--core', 'sets core to true')
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer(`dream sync:schema`, omitCoreArg(program.args)))
    await sspawn(yarncmdRunByAppConsumer(`dream sync:associations`, omitCoreArg(program.args)))
    await maybeSyncRoutes()
  })

program
  .command('sync:schema')
  .alias('sync')
  .alias('introspect')
  .description(
    'introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
  )
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer(`dream sync:schema`, omitCoreArg(program.args)))
  })

program
  .command('sync:associations')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer(`dream sync:associations`, omitCoreArg(program.args)))
  })

program
  .command('sync:existing')
  .description('syncs existing types to dream')
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer(`dream sync:existing`, omitCoreArg(program.args)))
  })

program
  .command('routes')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}ts-node --transpile-only ./bin/routes.ts`)
  })

program
  .command('sync:routes')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    await syncRoutes()
  })

program
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .action(async () => {
    console.log('PSY DEBUG 1: db:migrate called')
    await ensureStableAppBuild(program.args)
    console.log('PSY DEBUG 2: ensureStableAppBuild passed')
    await sspawn(yarncmdRunByAppConsumer(`dream db:migrate`, omitCoreArg(program.args)))
    console.log('PSY DEBUG 3: db:migrate passed')
    await maybeSyncRoutes()
  })

program
  .command('db:reset')
  .description('db:reset drops, creates, migrates, and seeds database, followed by a type sync')
  .option('--core', 'sets core to true')
  .action(async () => {
    await ensureStableAppBuild(program.args)
    await sspawn(yarncmdRunByAppConsumer(`dream db:reset`, omitCoreArg(program.args)))
    await maybeSyncRoutes()
  })

program
  .command('db:create')
  .description(
    'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer(`dream db:create`, omitCoreArg(program.args)))
  })

program
  .command('db:drop')
  .description(
    'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .action(async () => {
    await sspawn(yarncmdRunByAppConsumer(`dream db:drop`, omitCoreArg(program.args)))
  })

program
  .command('console')
  .description('initiates a repl, loading the models from the development test-app into scope for easy use')
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(program.args)
    if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') {
      await sspawn(`NODE_ENV=development npx ts-node --project ./tsconfig.json ./test-app/conf/repl.ts`)
    } else {
      await sspawn(`NODE_ENV=development npx ts-node --project ./tsconfig.json ./src/conf/repl.ts`)
    }
  })

program.parse()

async function maybeSyncRoutes() {
  if (['development', 'test'].includes(process.env.NODE_ENV || '')) {
    syncRoutes()
  }
}

async function syncRoutes() {
  const coreDevFlag = setCoreDevelopmentFlag(program.args)
  await sspawn(`${coreDevFlag}ts-node --transpile-only ./bin/sync-routes.ts`)
}
