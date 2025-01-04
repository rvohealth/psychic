import { DreamCLI } from '@rvohealth/dream'
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
    DreamCLI.generateDreamCli(program, {
      initializeDreamApplication: initializePsychicApplication,
      seedDb,
      onSync: async () => {
        await PsychicBin.sync({ bypassDreamSync: true })
      },
    })

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
        '[columnsWithTypes...]',
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
        await PsychicBin.sync()
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
  }
}
