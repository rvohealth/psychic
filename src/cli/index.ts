import { DreamCLI } from '@rvoh/dream'
import { Command } from 'commander'
import PsychicBin from '../bin/index.js'
import generateSyncEnumsInitializer from '../generate/initializer/syncEnums.js'
import generateSyncOpenapiTypescriptInitializer from '../generate/initializer/syncOpenapiTypescript.js'
import generateOpenapiReduxBindings from '../generate/openapi/reduxBindings.js'
import PsychicApp, { PsychicAppInitOptions } from '../psychic-app/index.js'

export default class PsychicCLI {
  public static provide(
    program: Command,
    {
      initializePsychicApp,
      seedDb,
    }: {
      initializePsychicApp: (opts?: PsychicAppInitOptions) => Promise<PsychicApp>
      seedDb: () => Promise<void> | void
    },
  ) {
    DreamCLI.generateDreamCli(program, {
      initializeDreamApp: initializePsychicApp,
      seedDb,
      onSync: async () => {
        await PsychicBin.sync({ bypassDreamSync: true })
      },
    })

    program
      .command('generate:resource')
      .alias('g:resource')
      .description('create a Dream model, migration, controller, serializer, and spec placeholders')
      .option(
        '--sti-base-serializer',
        'omits the serializer from the dream model, but does create the serializer so it can be extended by STI children',
      )
      .option(
        '--owning-model <modelName>',
        'The model class of the object that `associationQuery`/`createAssociation` will be performed on in the created controller and spec (e.g., "Host", "Guest") (simply to save time making changes to the generated code). Defaults to User',
      )
      .argument('<path>', 'URL path from root domain')
      .argument(
        '<modelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences',
      )
      .argument(
        '[columnsWithTypes...]',
        'properties of the model property1:text/string/enum/etc. property2:text/string/enum/etc. ... propertyN:text/string/enum/etc.',
      )
      .action(
        async (
          route: string,
          modelName: string,
          columnsWithTypes: string[],
          options: { stiBaseSerializer: boolean; owningModel?: string },
        ) => {
          await initializePsychicApp()
          await PsychicBin.generateResource(route, modelName, columnsWithTypes, options)
          process.exit()
        },
      )

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
        await initializePsychicApp()
        await PsychicBin.generateController(controllerName, actions)
        process.exit()
      })

    program
      .command('setup:sync:enums')
      .description('generates an initializer in your app for syncing enums to a particular path.')
      .argument(
        '<outfile>',
        'the path from your backend directory to the location which you want the enums copied. Should end with .ts, i.e. "../client/src/api/enums.ts"',
      )
      .option(
        '--initializer-filename',
        'the name you want the file to be in your initializers folder. defaults to `sync-enums.ts`',
      )
      .action(
        async (
          outfile: string,
          {
            initializerName,
          }: {
            initializerName: string
          },
        ) => {
          await initializePsychicApp()
          await generateSyncEnumsInitializer(outfile, initializerName)
          process.exit()
        },
      )

    program
      .command('setup:sync:openapi-redux')
      .description(
        'generates openapi redux bindings to connect one of your openapi files to one of your clients',
      )
      .option(
        '--schema-file',
        'the path from your api root to the openapi file you wish to use to generate your schema, i.e. ./openapi/openapi.json',
      )
      .option(
        '--api-file',
        'the path to the boilerplate api file that will be used to scaffold your backend endpoints together with, i.e. ../client/app/api.ts',
      )
      .option('--api-import', 'the camelCased name of the export from your api module, i.e. emptyBackendApi')
      .option(
        '--output-file',
        'the path to the file that will contain your typescript openapi redux bindings, i.e. ../client/app/myBackendApi.ts',
      )
      .option('--export-name', 'the camelCased name to use for your exported api, i.e. myBackendApi')
      .action(
        async ({
          schemaFile,
          apiFile,
          apiImport,
          outputFile,
          exportName,
        }: {
          schemaFile: string
          apiFile: string
          apiImport: string
          outputFile: string
          exportName: string
        }) => {
          await initializePsychicApp()
          await generateOpenapiReduxBindings({
            exportName,
            schemaFile,
            apiFile,
            apiImport,
            outputFile,
          })
          process.exit()
        },
      )

    program
      .command('setup:sync:openapi-typescript')
      .description(
        'generates an initializer in your app for converting one of your openapi files to typescript',
      )
      .argument(
        '<openapiFilepath>',
        'the path from your backend directory to the openapi file you wish to scan, i.e. "./openapi/openapi.json"',
      )
      .argument(
        '<outfile>',
        'the path from your backend directory to the location which you want the openapi types written to. Must end with .d.ts, i.e. "./src/conf/openapi/openapi.types.d.ts"',
      )
      .option(
        '--initializer-filename',
        'the name you want the file to be in your initializers folder. defaults to `sync-openapi-typescript.ts`',
      )
      .action(
        async (
          openapiFilepath: string,
          outfile: string,
          {
            initializerName,
          }: {
            initializerName: string
          },
        ) => {
          await initializePsychicApp()
          await generateSyncOpenapiTypescriptInitializer(
            openapiFilepath,
            outfile,
            initializerName as `${string}.d.ts`,
          )
          process.exit()
        },
      )

    program
      .command('routes')
      .description(
        'examines your current models, building a type-map of the associations so that the ORM can understand your relational setup. This is commited to your repo, and synced to the dream repo for consumption within the underlying library.',
      )
      .action(async () => {
        await initializePsychicApp()
        await PsychicBin.routes()
        process.exit()
      })

    program
      .command('sync')
      .description(
        'sync introspects your database, updating your schema to reflect, and then syncs the new schema with the installed dream node module, allowing it provide your schema to the underlying kysely integration',
      )
      .action(async () => {
        await initializePsychicApp()
        await PsychicBin.sync()
        process.exit()
      })

    program
      .command('post-sync')
      .description(
        'an internal command that runs as the second stage of the `sync` command, since after types are rebuit, the application needs to be reloaded before autogenerating certain files, since those files will need to leverage the updated types',
      )
      .action(async () => {
        await initializePsychicApp()
        await PsychicBin.postSync()
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
        await initializePsychicApp()
        await PsychicBin.syncOpenapiJson()
        process.exit()
      })
  }
}
