#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import { Command } from 'commander'
import * as fs from 'fs/promises'
import sspawn from '../src/helpers/sspawn'
import generateResource from '../src/generate/resource'
import setCoreDevelopmentFlag, { coreSuffix } from './cli/helpers/setCoreDevelopmentFlag'
import generateSerializer from '../src/generate/serializer'
import generateController from '../src/generate/controller'

const program = new Command()

program
  .command('dream')
  .description('calls to the underlying dream cli')
  .action(async () => {
    await sspawn(`yarn dream ${program.args.slice(1, program.args.length).join(' ')}`)
  })

program
  .command('spec')
  .description('runs all specs if no spec is provided. If a spec is provided, it will run that spec.')
  .action(async () => {
    const [_, file] = program.args
    const cwdStr = program.args.includes('--core') ? ' ' : ' --cwd=../../ '
    if (!file) {
      await sspawn(`yarn${cwdStr}uspec && yarn${cwdStr}fspec`)
    } else if (/spec\/features\//.test(file)) {
      await sspawn(`yarn${cwdStr}fspec ${file}`)
    } else {
      await sspawn(`yarn${cwdStr}uspec ${file}`)
    }
  })

program
  .command('clean')
  .description('cleans up existing test infrastructure from psychic and dream installations')
  .action(async () => {
    console.log('removing dream test infrastructure...')
    await fs.rm(`../../node_modules/dream/test-app`, {
      recursive: true,
      force: true,
    })

    console.log('removing psychic test infrastructure...')
    await fs.rm(`../../node_modules/psychic/test-app`, {
      recursive: true,
      force: true,
    })
  })

program
  .alias('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('generate:model <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .action(async () => {
    const [_, name, ...attributes] = program.args
    if (process.env.CORE_DEVELOPMENT === '1') {
      await sspawn(`yarn dream g:model ${name} ${attributes.join(' ')}`)
    } else {
      await sspawn(`yarn --cwd=../../node_modules/dream dream g:model ${name} ${attributes.join(' ')}`)
    }
  })

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .action(async () => {
    const [_, name] = program.args
    await sspawn(`yarn dream g:migration ${name}`)

    if (process.env.CORE_DEVELOPMENT === '1') {
      await sspawn(`yarn dream g:migration ${name}`)
    } else {
      await sspawn(`yarn --cwd=../../node_modules/dream dream g:migration ${name}`)
    }
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

    if (process.env.CORE_DEVELOPMENT === '1') {
    } else {
      process.env.OVERRIDDEN_ROOT_PATH = process.cwd() + '/../../src'
    }

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
    const [_, name, ...attributes] = program.args

    if (process.env.CORE_DEVELOPMENT === '1') {
    } else {
      process.env.OVERRIDDEN_ROOT_PATH = process.cwd() + '/../../src'
    }

    await generateSerializer(
      name,
      attributes.filter(attr => !['--core'].includes(attr))
    )
  })

program
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .action(async () => {
    await sspawn(`yarn dream db:migrate${coreSuffix(program.args)}`)
  })

program
  .command('sync:all')
  .description('cleans up installation files')
  .option('--core', 'sets core to true')
  .action(async () => {
    try {
      await fs.stat('./node_modules/dream/test-app')
      console.log('test-app still present in dream installation, removing...')
      await fs.rm('./node_modules/dream/test-app', { recursive: true, force: true })
    } catch (error) {
      // intentionally ignore, since we expect this dir to be empty.
    }

    // TODO: figure out why this throws DB error. For now, this is manually run by the
    // consuming app.
    // await sspawn(`yarn dream sync:all`)
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
  .command('routes')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--core', 'sets core to true')
  .action(async () => {
    const coreDevFlag = setCoreDevelopmentFlag(program.args)
    await sspawn(`${coreDevFlag}ts-node ./bin/routes.ts`)
  })

program
  .command('copy:models')
  .description('builds internal index for models')
  .action(async () => {
    await sspawn(`npx ts-node ./.dream/bin/copy-models.ts`)
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
