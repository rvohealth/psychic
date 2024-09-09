import { DreamBin, developmentOrTestEnv } from '@rvohealth/dream'
import { Command } from 'commander'
import PsychicBin from '../bin'
import PsychicApplication from '../psychic-application'

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
      .description('create a new migration')
      .argument('<migrationName>', 'end with -to-table-name to prepopulate with an alterTable command')
      .argument(
        '[columnsWithTypes...]',
        'properties of the model column1:text/string/enum/etc. column2:text/string/enum/etc. ... columnN:text/string/enum/etc.',
      )
      .action(async (migrationName: string, columnsWithTypes: string[]) => {
        await initializePsychicApplication()
        await DreamBin.generateMigration(migrationName, columnsWithTypes)
        process.exit()
      })

    program
      .command('generate:model')
      .alias('g:model')
      .alias('generate:dream')
      .alias('g:dream')
      .option('--no-serializer')
      .description('create a new Dream model')
      .argument(
        '<modelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences',
      )
      .argument(
        '<columnsWithTypes...>',
        'properties of the model property1:text/string/enum/etc. property2:text/string/enum/etc. ... propertyN:text/string/enum/etc.',
      )
      .action(async (modelName: string, columnsWithTypes: string[], options: { serializer: boolean }) => {
        await initializePsychicApplication()
        await DreamBin.generateDream(modelName, columnsWithTypes, options)
        process.exit()
      })

    program
      .command('generate:sti-child')
      .alias('g:sti-child')
      .description(
        'create a new Dream model that extends another Dream model, leveraging STI (single table inheritance)',
      )
      .option('--no-serializer')
      .argument(
        '<childModelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences',
      )
      .argument('<extends>', 'just the word extends')
      .argument('<parentModelName>', 'name of the parent model')
      .argument(
        '[columnsWithTypes...]',
        'properties of the model property1:text/string/enum/etc. property2:text/string/enum/etc. ... propertyN:text/string/enum/etc.',
      )
      .action(
        async (
          childModelName: string,
          extendsWord: string,
          parentModelName: string,
          columnsWithTypes: string[],
          options: { serializer: boolean },
        ) => {
          await initializePsychicApplication()
          if (extendsWord !== 'extends')
            throw new Error('Expecting: `<child-name> extends <parent-name> <columns-and-types>')
          await DreamBin.generateStiChild(childModelName, parentModelName, columnsWithTypes, options)
          process.exit()
        },
      )

    program
      .command('generate:resource')
      .alias('g:resource')
      .description('create a Dream model, migration, controller, serializer, and spec placeholders')
      .argument('<path>', 'URL path from root domain')
      .argument(
        '<modelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences',
      )
      .argument(
        '<columnsWithTypes...>',
        'properties of the model property1:text/string/enum/etc. property2:text/string/enum/etc. ... propertyN:text/string/enum/etc.',
      )
      .action(async (route: string, modelName: string, columnsWithTypes: string[]) => {
        await initializePsychicApplication()
        await PsychicBin.generateResource(route, modelName, columnsWithTypes)
        process.exit()
      })

    program
      .command('generate:controller')
      .alias('g:controller')
      .description('create a controller')
      .argument(
        '<controllerName>',
        'the name of the controller to create, including namespaces, e.g. Posts or Api/V1/Posts',
      )
      .argument('[actions...]', 'the names of controller actions to create')

      .action(async (controllerName: string, actions: string[]) => {
        await initializePsychicApplication()
        await PsychicBin.generateController(controllerName, actions)
        process.exit()
      })

    program
      .command('routes')
      .description(
        'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.',
      )
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
      .action(async () => {
        await PsychicBin.syncRoutes()
      })

    program
      .command('sync:openapi')
      .description('syncs openapi.json file to current state of all psychic controllers within the app')
      .action(async () => {
        await initializePsychicApplication()
        await PsychicBin.syncOpenapiJson()
        process.exit()
      })

    program
      .command('sync:client')
      .description('sync api routes and schema to client application')
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
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.dbCreate()
        process.exit()
      })

    program
      .command('db:migrate')
      .description('db:migrate runs any outstanding database migrations')
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .action(async ({ skipSync }: { skipSync: boolean }) => {
        await initializePsychicApplication()
        await DreamBin.dbMigrate()

        if (developmentOrTestEnv() && !skipSync) {
          await DreamBin.sync()
        }

        process.exit()
      })

    program
      .command('db:rollback')
      .description('db:rollback rolls back the migration')
      .option('--step [integer]', 'number of steps back to travel', '1')
      .option('--skip-sync', 'skips syncing local schema after running migrations')
      .action(async ({ steps, skipSync }: { steps: number; skipSync: boolean }) => {
        await initializePsychicApplication()
        await DreamBin.dbRollback({ steps })

        if (developmentOrTestEnv() && !skipSync) {
          await DreamBin.sync()
        }

        process.exit()
      })

    program
      .command('db:drop')
      .description(
        'drops the database, seeding from local .env or .env.test if NODE_ENV=test is set for env vars',
      )
      .action(async () => {
        await initializePsychicApplication()
        await DreamBin.dbDrop()
        process.exit()
      })

    program
      .command('db:reset')
      .description('runs db:drop (safely), then db:create, db:migrate, and db:seed')
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
