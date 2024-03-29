#!/usr/bin/env node

// nice reference for shell commands:
// https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
// commanderjs docs:
// https://github.com/tj/commander.js#quick-start

import './cli/loadEnv'
import { Command } from 'commander'
import sspawn from './cli/helpers/sspawn'
import setCoreDevelopmentFlag from './cli/helpers/setCoreDevelopmentFlag'
import hijackRootForCLI from './cli/helpers/hijackRootForCLI'
import yarncmdRunByAppConsumer from './cli/helpers/yarncmdRunByAppConsumer'
import ensureStableAppBuild from './cli/helpers/ensureStableAppBuild'
import omitCoreArg from './cli/helpers/omitCoreArg'
import syncRoutes, { maybeSyncRoutes } from './cli/helpers/syncRoutes'
import nodeOrTsnodeCmd from './cli/helpers/nodeOrTsnodeCmd'
import dreamjsOrDreamtsCmd from './cli/helpers/dreamjsOrDreamtsCmd'
import developmentOrProdEnvString from './cli/helpers/developmentOrProdEnvString'
import readAppConfig from '../src/config/helpers/readAppConfig'

hijackRootForCLI()
const program = new Command()

function cmdargs() {
  return process.argv.slice(3, process.argv.length)
}

program
  .command('dream')
  .description('calls to the underlying dream cli')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const [cmd, ...cmdArgs] = process.argv.slice(2, process.argv.length)
    await sspawn(dreamjsOrDreamtsCmd(cmd, omitCoreArg(program.args), { cmdArgs }))
  })

program
  .command('build')
  .description('builds the underlying dream and psychic apps')
  .action(async () => {
    const dreamCmd = `
      NODE_ENV=${developmentOrProdEnvString()} yarn --cwd=../../../node_modules/@rvohealth/dream build
    `
    const psychicCmd = `
      echo \"building psychic app...\" && \
      npx tsc -p ./tsconfig.build.json
    `
    await sspawn(dreamCmd)
    await sspawn(psychicCmd)
    // await Promise.all([sspawn(dreamCmd), sspawn(psychicCmd)])
  })

program
  .command('spec')
  .description('runs all specs if no spec is provided. If a spec is provided, it will run that spec.')
  .option('--fast', 'skips setup')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)
    const fastFlag = args.includes('--fast') ? ':fast' : ''

    const [file] = args
    if (!file) {
      await sspawn(yarncmdRunByAppConsumer(`uspec${fastFlag}`, args))
      await sspawn(yarncmdRunByAppConsumer(`fspec${fastFlag}`, args))
    } else if (/spec\/features\//.test(file)) {
      await sspawn(yarncmdRunByAppConsumer(`fspec${fastFlag} ${file}`, args))
    } else {
      await sspawn(yarncmdRunByAppConsumer(`uspec${fastFlag} ${file}`, args))
    }
  })

program
  .command('clean')
  .description('cleans up existing test infrastructure from psychic and dream installations')
  .action(async () => {
    console.log('cleaning up psychic installation')
    await ensureStableAppBuild(cmdargs())
  })

program
  .alias('generate:dream')
  .alias('generate:model')
  .alias('g:model')
  .alias('g:dream')
  .description('generate:model <name> [...attributes] create a new dream')
  .argument('<name>', 'name of the dream')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)
    await sspawn(dreamjsOrDreamtsCmd('g:model', args, { cmdArgs: omitCoreArg(args) }))
  })

program
  .command('generate:migration')
  .alias('g:migration')
  .description('g:migration <name> create a new dream migration')
  .argument('<name>', 'name of the migration')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)
    const [name] = args
    await sspawn(dreamjsOrDreamtsCmd('g:migration', omitCoreArg(args), { cmdArgs: [name] }))
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
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    const [route, modelName, ...attributes] = args
    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-resource.ts', args, {
        fileArgs: [route, modelName, ...attributes],
      })
    )
  })

program
  .command('generate:controller')
  .alias('g:controller')
  .description(
    'generate:controller <route> [...methods] create a new controller, autodefining method stubs for passed methods'
  )
  .argument('<route>', 'route path')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    const [route, ...methods] = args
    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-controller.ts', args, {
        fileArgs: [route, ...methods],
      })
    )
  })

program
  .command('generate:serializer')
  .alias('g:serializer')
  .description('generate:serializer <name> [...attributes] create a new serializer')
  .argument('<name>', 'name of the migration')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)

    const [name, ...attributes] = args
    await sspawn(
      nodeOrTsnodeCmd('src/bin/generate-serializer.ts', omitCoreArg(args), {
        fileArgs: [name, ...attributes],
      })
    )
  })

program
  .command('sync:client')
  .description('sync api routes and schema to client application')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)
    await sspawn(dreamjsOrDreamtsCmd('g:api', args, { cmdArgs: omitCoreArg(args) }))
    await sspawn(
      nodeOrTsnodeCmd('src/bin/client/sync-routes.ts', omitCoreArg(args), {
        fileArgs: [],
      })
    )
  })

program
  .command('sync:client:routes')
  .description(
    'sync:client:routes generates a copy of the routes file that is consumable by your client application.'
  )
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)

    await sspawn(
      nodeOrTsnodeCmd('src/bin/client/sync-routes.ts', omitCoreArg(args), {
        fileArgs: [],
      })
    )
  })

program
  .command('sync:client:schema')
  .description('sync:client:schema generates schema from serializers for client application')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)
    await sspawn(dreamjsOrDreamtsCmd('g:api', args, { cmdArgs: omitCoreArg(args) }))
  })

program
  .command('sync')
  .description('runs yarn dream sync:schema, then yarn dream sync:associations')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await sspawn(dreamjsOrDreamtsCmd('sync:schema', omitCoreArg(args)))
    await sspawn(dreamjsOrDreamtsCmd('sync:associations', omitCoreArg(args)))
    await maybeSyncRoutes(args)

    const appConf = await readAppConfig()!
    if (!appConf.api_only) {
      await sspawn(dreamjsOrDreamtsCmd('g:api', args, { cmdArgs: omitCoreArg(args) }))
      await sspawn(
        nodeOrTsnodeCmd('src/bin/client/sync-routes.ts', omitCoreArg(args), {
          fileArgs: [],
        })
      )
    }
  })

program
  .command('sync:schema')
  .alias('introspect')
  .description(
    'introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration'
  )
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(dreamjsOrDreamtsCmd('sync:schema', omitCoreArg(cmdargs())))
  })

program
  .command('sync:associations')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(dreamjsOrDreamtsCmd('sync:associations', omitCoreArg(cmdargs())))
  })

program
  .command('routes')
  .description(
    'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.'
  )
  .option('--core', '--core', 'sets core to true')
  .option('--tsnode', '--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(nodeOrTsnodeCmd('src/bin/routes.ts', cmdargs(), { tsnodeFlags: ['--transpile-only'] }))
  })

program
  .command('sync:routes')
  .description(
    'reads the routes generated by your app and generates a cache file, which is then used to give autocomplete support to the route helper, amoongst other things.'
  )
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    console.log(
      'DEBUG: about to execute:',
      nodeOrTsnodeCmd('src/bin/sync-routes.ts', cmdargs(), { tsnodeFlags: ['--transpile-only'] })
    )
    await sspawn(nodeOrTsnodeCmd('src/bin/sync-routes.ts', cmdargs(), { tsnodeFlags: ['--transpile-only'] }))
  })

program
  .command('db:migrate')
  .description('db:migrate runs any outstanding database migrations')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)
    await sspawn(dreamjsOrDreamtsCmd('db:migrate', args))
    await maybeSyncRoutes(args)
  })

program
  .command('db:reset')
  .description('db:reset drops, creates, migrates, and seeds database, followed by a type sync')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await ensureStableAppBuild(args)
    await sspawn(dreamjsOrDreamtsCmd('db:reset', args))
    await maybeSyncRoutes(args)
  })

program
  .command('db:create')
  .description(
    'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(dreamjsOrDreamtsCmd('db:create', omitCoreArg(cmdargs())))
  })

program
  .command('db:drop')
  .description(
    'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars'
  )
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(dreamjsOrDreamtsCmd(`db:drop`, omitCoreArg(cmdargs())))
  })

program
  .command('db:rollback')
  .description('rolls back your migrations, traveling back the number of steps specified')
  .option('--step <integer>', '--step <integer> number of steps back to travel')
  .option('--core', 'sets core to true')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    const args = cmdargs()
    await sspawn(dreamjsOrDreamtsCmd(`db:rollback`, args, { cmdArgs: omitCoreArg(args) }))
  })

program
  .command('db:seed')
  .description('seeds the database')
  .option('--tsnode', 'runs the command using ts-node instead of node')
  .action(async () => {
    await sspawn(dreamjsOrDreamtsCmd(`db:seed`, omitCoreArg(cmdargs())))
  })

program
  .command('console')
  .description('initiates a repl, loading the models from the development test-app into scope for easy use')
  .option('--core', 'sets core to true')
  .action(async () => {
    setCoreDevelopmentFlag(cmdargs())
    if (process.env.PSYCHIC_CORE_DEVELOPMENT === '1') {
      await sspawn(`NODE_ENV=development npx ts-node ./dist/test-app/conf/repl.js`)
    } else {
      await sspawn(`NODE_ENV=development npx ts-node ./dist/src/conf/repl.js`)
    }
  })

program.parse()
