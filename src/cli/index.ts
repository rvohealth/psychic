import { DreamBin, developmentOrTestEnv } from '@rvohealth/dream'
import { Command } from 'commander'
import PsychicBin from '../bin'
import PsychicApplication from '../psychic-application'

function cmdargs() {
  return process.argv.slice(3, process.argv.length)
}

export default class PsychicCLI {
  public static provide(
    program: Command,
    {
      initializePsychicApplication,
      seedDb,
    }: {
      initializePsychicApplication: () => Promise<PsychicApplication>
      seedDb: () => Promise<void> | void
    },
  ) {
    program
      .command('generate:migration')
      .alias('g:migration')
      .description('g:migration <name> create a new dream migration')
      .argument('<name>', 'name of the migration')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.generateMigration()
        process.exit()
      })

    program
      .command('generate:dream')
      .alias('generate:model')
      .alias('g:dream')
      .alias('g:model')
      .description('generate:dream <name> [...attributes] create a new dream')
      .argument('<name>', 'name of the dream')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.generateDream()
        process.exit()
      })

    program
      .command('generate:sti-child')
      .alias('g:sti-child')
      .description('generate:dream <name> extends <base-name> [...attributes] create a new dream')
      .argument('<name>', 'name of the dream')
      .argument('<base-name>', 'name of the parent dream')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.generateStiChild()
        process.exit()
      })

    program
      .command('generate:factory')
      .alias('g:factory')
      .description('generate:factory [...attributes] create a new factory for a dream')
      .argument('<name>', 'name of the dream')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.generateFactory()
        process.exit()
      })

    program
      .command('generate:serializer')
      .alias('g:serializer')
      .description('generate:serializer <name> [...attributes] create a new serializer')
      .argument('<name>', 'name of the serializer')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.generateSerializer()
        process.exit()
      })

    program
      .command('generate:resource')
      .alias('g:resource')
      .description(
        'generate:resource <name> [...attributes] create a new dream, migration, controller, and serializer',
      )
      .argument('<route>', 'route path')
      .argument('<modelName>', 'model name')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await PsychicBin.generateResource()
        process.exit()
      })

    program
      .command('generate:controller')
      .alias('g:controller')
      .description(
        'generate:controller <route> [...methods] create a new controller, autodefining method stubs for passed methods',
      )
      .argument('<route>', 'route path')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await PsychicBin.generateController()
        process.exit()
      })

    program
      .command('routes')
      .description(
        'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.',
      )
      .option('--tsnode', '--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await PsychicBin.routes()
        process.exit()
      })

    program
      .command('sync')
      .description(
        'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration',
      )
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.sync()

        const psychicApp = PsychicApplication.getOrFail()

        if (psychicApp && !psychicApp?.apiOnly) {
          await PsychicBin.syncOpenapiJson()
          await PsychicBin.syncOpenapiClientSchema()
        }

        process.exit()
      })

    program
      .command('sync:routes')
      .description(
        'reads the routes generated by your app and generates a cache file, which is then used to give autocomplete support to the route helper, amoongst other things.',
      )
      .option('--core', 'sets core to true')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await PsychicBin.syncRoutes()
      })

    program
      .command('sync:openapi')
      .description('syncs openapi.json file to current state of all psychic controllers within the app')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await PsychicBin.syncOpenapiJson()
        process.exit()
      })

    program
      .command('sync:client')
      .description('sync api routes and schema to client application')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await PsychicBin.syncOpenapiJson()
        await PsychicBin.syncOpenapiClientSchema()
        process.exit()
      })

    program
      .command('db:create')
      .description(
        'creates a new database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars',
      )
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .option(
        '--bypass-config-cache',
        'bypasses running type cache build (this is typically used internally only)',
      )
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.dbCreate()
        process.exit()
      })

    program
      .command('db:migrate')
      .description('db:migrate runs any outstanding database migrations')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .option(
        '--bypass-config-cache',
        'bypasses running type cache build (this is typically used internally only)',
      )
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.dbMigrate()

        if (developmentOrTestEnv() && !cmdargs().includes('--skip-sync')) {
          await DreamBin.sync()
        }

        process.exit()
      })

    program
      .command('db:rollback')
      .description('db:rollback rolls back the migration')
      .option('--step <integer>', '--step <integer> number of steps back to travel')
      .option('--core', 'sets core to true')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .option(
        '--bypass-config-cache',
        'bypasses running type cache build (this is typically used internally only)',
      )
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.dbRollback()
        await DreamBin.sync()
        process.exit()
      })

    program
      .command('db:drop')
      .description(
        'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars',
      )
      .option('--core', 'sets core to true')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .option(
        '--bypass-config-cache',
        'bypasses running type cache build (this is typically used internally only)',
      )
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.dbDrop()
        process.exit()
      })

    program
      .command('db:reset')
      .description('db:reset runs db:drop (safely), then db:create, then db:migrate')
      .option('--core', 'sets core to true')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.dbDrop()
        await DreamBin.dbCreate()
        await DreamBin.dbMigrate()
        await DreamBin.sync()
        await seedDb()
        process.exit()
      })

    program
      .command('db:seed')
      .description('seeds the database using the file located in db/seed.ts')
      .option('--core', 'sets core to true')
      .option('--tsnode', 'runs the command using ts-node instead of node')
      .option(
        '--bypass-config-cache',
        'bypasses running type cache build (this is typically used internally only)',
      )
      .action(async () => {
        if (process.env.NODE_ENV === 'test' && process.env.DREAM_SEED_DB_IN_TEST !== '1') {
          console.log('skipping db seed for test env. To really seed for test, add DREAM_SEED_DB_IN_TEST=1')
          return
        }

        await initializePsychicApplication()
        await seedDb()
        process.exit()
      })
  }
}
