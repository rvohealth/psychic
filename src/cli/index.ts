import { DreamCLI } from '@rvoh/dream/system'
import { Command } from 'commander'
import PsychicBin, { BreakingChangesDetectedInOpenApiSpecError } from '../bin/index.js'
import generateController from '../generate/controller.js'
import generateSyncEnumsInitializer from '../generate/initializer/syncEnums.js'
import generateSyncOpenapiTypescriptInitializer from '../generate/initializer/syncOpenapiTypescript.js'
import generateOpenapiReduxBindings from '../generate/openapi/reduxBindings.js'
import generateResource from '../generate/resource.js'
import PsychicApp, { PsychicAppInitOptions } from '../psychic-app/index.js'
import Watcher from '../watcher/Watcher.js'

const INDENT = '                  '

const baseColumnsWithTypesDescription = `space separated snake-case (except for belongs_to model name) properties like this:
${INDENT}    title:citext subtitle:string body_markdown:text style:enum:post_styles:formal,informal User:belongs_to
${INDENT}
${INDENT}all properties default to not nullable; null can be allowed by appending ':optional':
${INDENT}    subtitle:string:optional
${INDENT}
${INDENT}supported types:
${INDENT}    - uuid:
${INDENT}    - uuid[]:
${INDENT}        a column optimized for storing UUIDs
${INDENT}
${INDENT}    - citext:
${INDENT}    - citext[]:
${INDENT}        case insensitive text (indexes and queries are automatically case insensitive)
${INDENT}
${INDENT}    - string:
${INDENT}    - string[]:
${INDENT}        varchar; allowed length defaults to 255, but may be customized, e.g.: subtitle:string:128 or subtitle:string:128:optional
${INDENT}
${INDENT}    - text
${INDENT}    - text[]
${INDENT}    - date
${INDENT}    - date[]
${INDENT}    - datetime
${INDENT}    - datetime[]
${INDENT}    - integer
${INDENT}    - integer[]
${INDENT}
${INDENT}    - decimal:
${INDENT}    - decimal[]:
${INDENT}        scale,precision is required, e.g.: volume:decimal:3,2 or volume:decimal:3,2:optional
${INDENT}
${INDENT}        leveraging arrays, add the "[]" suffix, e.g.: volume:decimal[]:3,2
${INDENT}
${INDENT}    - enum:
${INDENT}    - enum[]:
${INDENT}        include the enum name to automatically create the enum:
${INDENT}          type:enum:room_types:bathroom,kitchen,bedroom or type:enum:room_types:bathroom,kitchen,bedroom:optional
${INDENT}
${INDENT}        omit the enum values to leverage an existing enum (omits the enum type creation):
${INDENT}          type:enum:room_types or type:enum:room_types:optional
${INDENT}
${INDENT}        leveraging arrays, add the "[]" suffix, e.g.: type:enum[]:room_types:bathroom,kitchen,bedroom`

const columnsWithTypesDescription =
  baseColumnsWithTypesDescription +
  `
${INDENT}
${INDENT}    - belongs_to:
${INDENT}        not only adds a foreign key to the migration, but also adds a BelongsTo association to the generated model:
${INDENT}
${INDENT}        include the fully qualified model name, e.g., if the Coach model is in src/app/models/Health/Coach:
${INDENT}          Health/Coach:belongs_to`

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
      .description(
        'Generates a Dream model with corresponding spec factory, serializer, migration, and controller with the inheritance chain leading to that controller, with fleshed out specs for each resourceful action in the controller.',
      )
      .option(
        '--singular',
        'generates a "resource" route instead of "resources", along with the necessary controller and spec changes',
      )
      .option(
        '--only <onlyActions>',
        `comma separated list of resourceful endpionts (e.g. "--only=create,show"); any of:
                              - index
                              - create
                              - show
                              - update
                              - delete`,
      )
      .option(
        '--sti-base-serializer',
        'omits the serializer from the dream model, but does create the serializer so it can be extended by STI children',
      )
      .option(
        '--owning-model <modelName>',
        'the model class of the object that `associationQuery`/`createAssociation` will be performed on in the created controller and spec (e.g., "Host", "Guest", "Ticketing/Ticket") (simply to save time making changes to the generated code). Defaults to User',
      )
      .option(
        '--connection-name <connectionName>',
        'the name of the db connection you would like to use for your model. Defaults to "default"',
        'default',
      )
      .argument(
        '<path>',
        'URL path from root domain. Specify nesting resource with `{}`, e.g.: `tickets/{}/comments`',
      )
      .argument(
        '<modelName>',
        'the name of the model to create, e.g. Post or Settings/CommunicationPreferences',
      )
      .argument('[columnsWithTypes...]', columnsWithTypesDescription)
      .action(
        async (
          route: string,
          modelName: string,
          columnsWithTypes: string[],
          options: {
            singular: boolean
            onlyActions?: string
            stiBaseSerializer: boolean
            owningModel?: string
            connectionName: string
          },
        ) => {
          await initializePsychicApp({
            bypassDreamIntegrityChecks: true,
            bypassDbConnectionsDuringInit: true,
          })
          await PsychicBin.generateResource(route, modelName, columnsWithTypes, options)
          process.exit()
        },
      )

    program
      .command('generate:controller')
      .alias('g:controller')
      .description(
        'Generates a controller and the inheritance chain leading to that controller, and a spec skeleton for the controller.',
      )
      .argument(
        '<controllerName>',
        'the name of the controller to create, including namespaces, e.g. Posts or Api/V1/Posts',
      )
      .argument('[actions...]', 'the names of controller actions to create')
      .action(async (controllerName: string, actions: string[]) => {
        await initializePsychicApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })
        await PsychicBin.generateController(controllerName, actions)
        process.exit()
      })

    program
      .command('setup:sync:enums')
      .description('Generates an initializer in your app for syncing enums to a particular path.')
      .argument(
        '<outfile>',
        'the path from your backend directory to the location which you want the enums copied. Should end with .ts, i.e. "../client/src/api/enums.ts"',
      )
      .option(
        '--initializer-filename <initializerFilename>',
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
          await initializePsychicApp({
            bypassDreamIntegrityChecks: true,
            bypassDbConnectionsDuringInit: true,
          })
          await generateSyncEnumsInitializer(outfile, initializerName)
          process.exit()
        },
      )

    program
      .command('setup:sync:openapi-redux')
      .description(
        'Generates openapi redux bindings to connect one of your openapi files to one of your clients.',
      )
      .option(
        '--schema-file <schemaFile>',
        'the path from your api root to the openapi file you wish to use to generate your schema, i.e. ./src/openapi/openapi.json',
      )
      .option(
        '--api-file <apiFile>',
        'the path to the boilerplate api file that will be used to scaffold your backend endpoints together with, i.e. ../client/app/api.ts',
      )
      .option(
        '--api-import <apiImport>',
        'the camelCased name of the export from your api module, i.e. emptyBackendApi',
      )
      .option(
        '--output-file <outputFile>',
        'the path to the file that will contain your typescript openapi redux bindings, i.e. ../client/app/myBackendApi.ts',
      )
      .option(
        '--export-name <exportName>',
        'the camelCased name to use for your exported api, i.e. myBackendApi',
      )
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
          await initializePsychicApp({
            bypassDreamIntegrityChecks: true,
            bypassDbConnectionsDuringInit: true,
          })
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
        'Generates an initializer in your app for converting one of your openapi files to typescript.',
      )
      .argument(
        '<openapiFilepath>',
        'the path from your backend directory to the openapi file you wish to scan, i.e. "./src/openapi/openapi.json"',
      )
      .argument(
        '<outfile>',
        'the path from your backend directory to the location which you want the openapi types written to. Must end with .d.ts, i.e. "./src/conf/openapi/openapi.types.d.ts"',
      )
      .option(
        '--initializer-filename <initializerFilename>',
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
          await initializePsychicApp({
            bypassDreamIntegrityChecks: true,
            bypassDbConnectionsDuringInit: true,
          })
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
        'Prints a list of routes defined by the application, including path arguments and the controller/action reached by the route.',
      )
      .action(async () => {
        await initializePsychicApp()
        PsychicBin.printRoutes()
        process.exit()
      })

    program
      .command('sync')
      .description(
        "Generates types from the current state of the database. Generates OpenAPI specs from @OpenAPI decorated controller actions. Additional sync actions may be customized with `on('cli:sync', async () => {})` in conf/app.ts or in an initializer in `conf/initializers/`.",
      )
      .option('--ignore-errors')
      .option('--schema-only')
      .action(async (options: { ignoreErrors: boolean; schemaOnly: boolean }) => {
        await initializePsychicApp({ bypassDreamIntegrityChecks: options.ignoreErrors || options.schemaOnly })
        await PsychicBin.sync(options)
        process.exit()
      })

    program
      .command('watch')
      .description('watches your app for changes, and re-syncs any time they happen')
      .argument('[dir]', 'the folder you want to watch, defaults to ./src')
      .action(async (dir?: string) => {
        await initializePsychicApp({ bypassDreamIntegrityChecks: true })
        Watcher.watch(dir)
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
        'Reads the routes generated by your app and generates a cache file, which is then used to give autocomplete support to the route helper and other things.',
      )
      .action(async () => {
        await PsychicBin.syncRoutes()
      })

    program
      .command('sync:openapi')
      .description('Syncs openapi.json file to current state of all psychic controllers within the app')
      .action(async () => {
        await initializePsychicApp()
        await PsychicBin.syncOpenapiJson()
        process.exit()
      })

    program
      .command('diff:openapi')
      .description(
        'compares the current branch open api spec file(s) with the main/master/head branch open api spec file(s)',
      )
      .option('-f', '--fail-on-breaking', 'fail on spec changes that are breaking')
      .action(async (options: { failOnBreaking: boolean }) => {
        await initializePsychicApp()

        try {
          PsychicBin.openapiDiff()
        } catch (error) {
          if (error instanceof BreakingChangesDetectedInOpenApiSpecError) {
            if (options.failOnBreaking) {
              console.error(error.message)
              process.exit(1)
            }
          } else {
            throw error
          }
        }
      })
  }

  /**
   * @internal
   */
  public static async generateController(opts: {
    fullyQualifiedControllerName: string
    fullyQualifiedModelName?: string
    actions: string[]
    columnsWithTypes?: string[]
    resourceSpecs?: boolean
    owningModel?: string | undefined
    singular: boolean
  }) {
    await generateController(opts)
  }

  /**
   * @internal
   */
  public static async generateResource(opts: {
    route: string
    fullyQualifiedModelName: string
    options: {
      singular: boolean
      only?: string
      stiBaseSerializer: boolean
      owningModel?: string
      connectionName: string
    }
    columnsWithTypes: string[]
  }) {
    await generateResource(opts)
  }
}
