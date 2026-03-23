import { DreamCLI } from '@rvoh/dream/system'
import { Command } from 'commander'
import PsychicBin, { BreakingChangesDetectedInOpenApiSpecError } from '../bin/index.js'
import generateController from '../generate/controller.js'
import generateSyncEnumsInitializer from '../generate/initializer/syncEnums.js'
import generateSyncOpenapiTypescriptInitializer from '../generate/initializer/syncOpenapiTypescript.js'
import generateOpenapiReduxBindings from '../generate/openapi/reduxBindings.js'
import generateOpenapiZustandBindings from '../generate/openapi/zustandBindings.js'
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
${INDENT}    - encrypted:
${INDENT}        encrypted text (used in conjunction with the @deco.Encrypted decorator)
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
${INDENT}    - time
${INDENT}    - time[]
${INDENT}    - timetz
${INDENT}    - timetz[]
${INDENT}    - integer
${INDENT}    - integer[]
${INDENT}
${INDENT}    - decimal:
${INDENT}    - decimal[]:
${INDENT}        precision,scale is required, e.g.: volume:decimal:3,2 or volume:decimal:3,2:optional
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
${INDENT}        ALWAYS use this instead of adding a raw uuid column for foreign keys. It creates the FK column, adds a database index,
${INDENT}        AND generates the @deco.BelongsTo association and typed property on the model. A raw uuid column does none of this.
${INDENT}
${INDENT}        use the fully qualified model name (matching its path under src/app/models/):
${INDENT}          User:belongs_to                  # creates user_id column + BelongsTo association
${INDENT}          Health/Coach:belongs_to           # creates health_coach_id column + BelongsTo association
${INDENT}          User:belongs_to:optional          # nullable foreign key (for optional associations)`

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
        `Generates a Dream model with corresponding spec factory, serializer, migration, and controller with the inheritance chain leading to that controller, with fleshed out specs for each resourceful action in the controller.
${INDENT}
${INDENT}This is the preferred generator when the model will be accessible via HTTP requests (API endpoints, admin panels, internal tools). It scaffolds everything needed for a full CRUD resource. Prefer this over g:model unless the model is purely internal with no HTTP access.
${INDENT}
${INDENT}Examples:
${INDENT}  # Basic resource with CRUD endpoints
${INDENT}  pnpm psy g:resource v1/posts Post User:belongs_to title:citext body:text
${INDENT}
${INDENT}  # Nested resource under a parent (use {} for nesting resource ID placeholder)
${INDENT}  pnpm psy g:resource --owning-model=Post v1/posts/\\{\\}/comments Post/Comment Post:belongs_to body:text
${INDENT}
${INDENT}  # Singular resource (HasOne relationship from parent model, no index action, no :id in URL)
${INDENT}  pnpm psy g:resource --singular v1/profile User/Profile User:belongs_to bio:text
${INDENT}
${INDENT}  # STI base resource
${INDENT}  pnpm psy g:resource --sti-base-serializer v1/host/rentals Rental type:enum:place_types:Apartment,House,Condo`,
      )
      .option(
        '--singular',
        `Use when the parent model has-one of this resource (e.g., a User HasOne Profile, a Candidate HasOne Linkedin).
${INDENT}Generates a singular \`r.resource\` route instead of plural \`r.resources\`, omits the \`index\` action, and removes \`:id\` from URLs since there is only one per parent.
${INDENT}
${INDENT}Examples:
${INDENT}  pnpm psy g:resource --singular v1/profile User/Profile User:belongs_to bio:text
${INDENT}  pnpm psy g:resource --singular --owning-model=Candidate internal/candidates/\\{\\}/linkedin Candidate/Linkedin Candidate:belongs_to url:string`,
        false,
      )
      .option(
        '--only <onlyActions>',
        `comma separated list of resourceful endpoints to generate (omitted actions will not have controller methods, specs, or routes).
${INDENT}
${INDENT}Available actions: index, create, show, update, delete
${INDENT}
${INDENT}Examples:
${INDENT}  --only=index,create,show       # create and view only (e.g., form submissions)
${INDENT}  --only=index,show,update     # modify only (e.g., settings management)`,
      )
      .option(
        '--sti-base-serializer',
        `Creates generically typed base serializers (default and summary) that accept a \`StiChildClass\` parameter and include the \`type\` attribute with a per-child enum constraint. This allows consuming applications to determine the response shape based on the STI type discriminator.
${INDENT}
${INDENT}Use this when generating the parent model of an STI hierarchy. After generating the parent, use g:sti-child for each child type.
${INDENT}
${INDENT}Example:
${INDENT}  # CRITICAL: the type enums must exactly match the class names of the STI children
${INDENT}  pnpm psy g:resource --sti-base-serializer v1/host/rentals Rental type:enum:place_types:Apartment,House,Condo
${INDENT}  # STI children subsequently generated using the g:sti-child generator (note the use of \`--model-name\` to generate class names that match the \`type\` column, e.g., "Apartment" instead of the "RentalApartment" default):
${INDENT}  pnpm psy g:sti-child --model-name=Apartment Rental/Apartment extends Rental
${INDENT}  pnpm psy g:sti-child --model-name=House Rental/House extends Rental
${INDENT}  pnpm psy g:sti-child --model-name=Condo Rental/Condo extends Rental`,
        false,
      )
      .option(
        '--owning-model <modelName>',
        `The model class that owns this resource. The generated controller will use \`associationQuery\` and \`createAssociation\` on the owning model to scope queries and create records.
${INDENT}
${INDENT}Defaults to \`this.currentUser\` for non-admin/internal routes (e.g., \`this.currentUser.associationQuery('posts').findOrFail(this.castParam('id', 'uuid'))\`).
${INDENT}Defaults to \`null\` for admin/internal namespaced controllers (e.g., \`Post.findOrFail(this.castParam('id', 'uuid'))\`).
${INDENT}Supplying an owning-modle changes the the generated code in the controller to be relative to the owning model.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy g:resource --owning-model=Host v1/host/places Place
${INDENT}  # results in \`await this.currentHost.associationQuery('places').findOrFail(this.castParam('id', 'uuid'))\``,
      )
      .option(
        '--connection-name <connectionName>',
        'the name of the database connection to use for the model. Only needed for multi-database setups; defaults to "default"',
        'default',
      )
      .option(
        '--table-name <tableName>',
        `Explicit table name to use instead of the auto-generated one. Useful when model namespaces produce long or awkward table names.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy g:resource --table-name=notif_prefs v1/notification-preferences Settings/NotificationPreferences User:belongs_to`,
      )
      .option(
        '--model-name <modelName>',
        `Explicit model class name to use instead of the one auto-derived from the model path. Useful when the path segments don't match the desired class name.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy g:resource --model-name=GroupDanceLesson v1/lessons/dance/groups Lesson/Dance/Group
${INDENT}  # model is named GroupDanceLesson instead of LessonDanceGroup`,
      )
      .argument(
        '<path>',
        `The URL path for this resource's routes, relative to the root domain. Use \`\\{\\}\` as a placeholder for a parent resource's ID parameter when nesting.
${INDENT}
${INDENT}The path determines the controller namespace hierarchy. Paths that begin with "admin" and "internal" remove the \`currentUser\` scoping of queries (\`--owning-model\` may be provided to apply query scoping). Each segment maps to a directory level in the controllers folder.
${INDENT}
${INDENT}Examples:
${INDENT}  v1/posts                          # /v1/posts, /v1/posts/:id
${INDENT}  v1/host/places                    # /v1/host/places, /v1/host/places/:id
${INDENT}  v1/posts/\\{\\}/comments              # /v1/posts/:postId/comments, /v1/posts/:postId/comments/:id
${INDENT}  internal/candidates/\\{\\}/linkedin   # /internal/candidates/:candidateId/linkedin (with --singular)`,
      )
      .argument(
        '<modelName>',
        `The fully qualified model name, using / for namespacing. This determines the model class name (may be overridden with \`--model-name\`), table name, and file path under src/app/models/.
${INDENT}
${INDENT}Examples:
${INDENT}  Post                                # src/app/models/Post.ts, table: posts
${INDENT}  Post/Comment                        # src/app/models/Post/Comment.ts, table: post_comments`,
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
            tableName?: string
            modelName?: string
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
        `Generates a controller and the full inheritance chain leading to that controller, along with a spec skeleton. Use this for standalone controllers that are not tied to a model (e.g., auth, health checks, custom actions). For model-backed CRUD, prefer g:resource instead.
${INDENT}
${INDENT}Examples:
${INDENT}  pnpm psy g:controller Auth login logout refresh
${INDENT}  pnpm psy g:controller V1/Admin/Reports generate download
${INDENT}  pnpm psy g:controller Api/V1/Webhooks stripe sendgrid`,
      )
      .argument(
        '<controllerName>',
        `The name of the controller to create, using / for namespace directories. Each segment creates a directory and a base controller in the inheritance chain.
${INDENT}
${INDENT}Examples:
${INDENT}  Auth                    # src/app/controllers/AuthController.ts
${INDENT}  V1/Admin/Reports        # src/app/controllers/V1/Admin/ReportsController.ts (extends V1/Admin/V1AdminBaseController)`,
      )
      .argument(
        '[actions...]',
        `Space-separated list of action method names to generate on the controller (e.g., login logout refresh). Each action gets a method stub in the controller and a describe block in the spec.`,
      )
      .action(async (controllerName: string, actions: string[]) => {
        await initializePsychicApp({ bypassDreamIntegrityChecks: true, bypassDbConnectionsDuringInit: true })
        await PsychicBin.generateController(controllerName, actions)
        process.exit()
      })

    program
      .command('setup:sync:enums')
      .description(
        `Generates an initializer that automatically exports all Dream enum types to a TypeScript file during sync. This is a one-time setup command — once the initializer exists, enums are synced automatically on every \`pnpm psy sync\`.
${INDENT}
${INDENT}Use this to share enum types between your backend and frontend without manual duplication.
${INDENT}
${INDENT}**WARNING**: This currently syncs **all** database enums to the specified front end, which may not be appropriate for all use cases. It's on our roadmap to base this on specified OpenAPI specs.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy setup:sync:enums ../client/src/api/enums.ts`,
      )
      .argument(
        '<outfile>',
        'the output path (relative to backend root) where enum types will be written on each sync. Should end with .ts, e.g., "../client/src/api/enums.ts"',
      )
      .option(
        '--initializer-filename <initializerFilename>',
        'custom filename for the generated initializer in src/conf/initializers/. Defaults to `sync-enums.ts`',
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
        `Generates an initializer that creates typed RTK Query API bindings from your OpenAPI spec during sync. This is a one-time setup command — once configured, bindings are regenerated automatically on every \`pnpm psy sync\`.
${INDENT}
${INDENT}Use this for React frontends using Redux Toolkit / RTK Query. For Zustand or other state managers, use setup:sync:openapi-zustand instead.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy setup:sync:openapi-redux \\
${INDENT}    --schema-file=./src/openapi/openapi.json \\
${INDENT}    --api-file=../client/app/api.ts \\
${INDENT}    --api-import=emptyBackendApi \\
${INDENT}    --output-file=../client/app/backendApi.ts \\
${INDENT}    --export-name=backendApi`,
      )
      .option(
        '--schema-file <schemaFile>',
        'path to the OpenAPI JSON spec file generated by Psychic, e.g., ./src/openapi/openapi.json',
      )
      .option(
        '--api-file <apiFile>',
        'path to the RTK Query base API file that defines the empty API with createApi(), e.g., ../client/app/api.ts',
      )
      .option(
        '--api-import <apiImport>',
        'the camelCased export name from the base API file to inject endpoints into, e.g., emptyBackendApi',
      )
      .option(
        '--output-file <outputFile>',
        'path where the generated typed API bindings will be written, e.g., ../client/app/backendApi.ts',
      )
      .option(
        '--export-name <exportName>',
        'the camelCased name for the exported enhanced API object, e.g., backendApi',
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
      .command('setup:sync:openapi-zustand')
      .description(
        `Generates an initializer that creates typed API functions from your OpenAPI spec using @hey-api/openapi-ts during sync. This is a one-time setup command — once configured, API functions are regenerated automatically on every \`pnpm psy sync\`.
${INDENT}
${INDENT}Use this for frontends using Zustand, Jotai, or any non-Redux state manager. For RTK Query / Redux Toolkit, use setup:sync:openapi-redux instead.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy setup:sync:openapi-zustand \\
${INDENT}    --schema-file=./src/openapi/openapi.json \\
${INDENT}    --output-dir=../client/app/api/backend \\
${INDENT}    --client-config-file=../client/app/api/backend/client.ts \\
${INDENT}    --export-name=backendApi`,
      )
      .option(
        '--schema-file <schemaFile>',
        'path to the OpenAPI JSON spec file generated by Psychic, e.g., ./src/openapi/openapi.json',
      )
      .option(
        '--output-dir <outputDir>',
        'directory where @hey-api/openapi-ts will generate typed API functions, types, and schemas, e.g., ../client/app/api/backend',
      )
      .option(
        '--client-config-file <clientConfigFile>',
        'path to the @hey-api/openapi-ts client configuration file that sets the base URL and credentials, e.g., ../client/app/api/backend/client.ts',
      )
      .option(
        '--export-name <exportName>',
        'the camelCased name for the exported API module, e.g., backendApi',
      )
      .action(
        async ({
          schemaFile,
          outputDir,
          clientConfigFile,
          exportName,
        }: {
          schemaFile: string
          outputDir: string
          clientConfigFile: string
          exportName: string
        }) => {
          await initializePsychicApp({
            bypassDreamIntegrityChecks: true,
            bypassDbConnectionsDuringInit: true,
          })
          await generateOpenapiZustandBindings({
            exportName,
            schemaFile,
            outputDir,
            clientConfigFile,
          })
          process.exit()
        },
      )

    program
      .command('setup:sync:openapi-typescript')
      .description(
        `Generates an initializer that converts your OpenAPI spec to TypeScript type definitions during sync. This is a one-time setup command — once configured, types are regenerated automatically on every \`pnpm psy sync\`.
${INDENT}
${INDENT}Use this when you need raw TypeScript types from the OpenAPI spec without a full API client. For typed API functions, use setup:sync:openapi-zustand or setup:sync:openapi-redux instead.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy setup:sync:openapi-typescript ./src/openapi/openapi.json ../client/src/api/openapi.types.d.ts`,
      )
      .argument(
        '<openapiFilepath>',
        'path to the OpenAPI JSON spec file generated by Psychic, e.g., "./src/openapi/openapi.json"',
      )
      .argument(
        '<outfile>',
        'output path for the generated TypeScript type definitions. Must end with .d.ts, e.g., "../client/src/api/openapi.types.d.ts"',
      )
      .option(
        '--initializer-filename <initializerFilename>',
        'custom filename for the generated initializer in src/conf/initializers/. Defaults to `sync-openapi-typescript.ts`',
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
      .command('inspect:controller-hierarchy')
      .alias('i:controller-hierarchy')
      .description(
        `Displays the inheritance hierarchy of all PsychicController classes in the project as a tree. Useful for understanding how controller base classes are organized and verifying that namespace grouping is correct.`,
      )
      .argument('[path]', 'the controllers directory to scan (defaults to the configured controllers path)')
      .action(async (controllersPath?: string) => {
        await initializePsychicApp()
        PsychicBin.printControllerHierarchy(controllersPath)
        process.exit()
      })

    program
      .command('check:controller-hierarchy')
      .description(
        `Checks that all controllers extend a controller in the same or parent directory. Exits with code 1 if any violations are found.
${INDENT}
${INDENT}This enforces the convention that controllers inherit from a base controller in their namespace (e.g., V1/Host/PlacesController should extend V1/Host/V1HostBaseController, not a controller from a sibling namespace). Useful as a CI check.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy check:controller-hierarchy`,
      )
      .argument('[path]', 'the controllers directory to scan (defaults to the configured controllers path)')
      .action(async (controllersPath?: string) => {
        await initializePsychicApp()
        const violations = PsychicBin.controllerHierarchyViolations(controllersPath)
        if (violations.length > 0) {
          for (const violation of violations) {
            console.error(violation)
          }
          process.exit(1)
        }
        process.exit()
      })

    program
      .command('routes')
      .description(
        `Prints all routes defined by the application, showing the HTTP method, URL path (with parameters), and the controller#action that handles each route. Useful for verifying route configuration and discovering available endpoints.
${INDENT}
${INDENT}Example output:
${INDENT}  GET    /v1/host/places                V1/Host/PlacesController#index
${INDENT}  POST   /v1/host/places                V1/Host/PlacesController#create
${INDENT}  GET    /v1/host/places/:id            V1/Host/PlacesController#show`,
      )
      .action(async () => {
        await initializePsychicApp()
        PsychicBin.printRoutes()
        process.exit()
      })

    program
      .command('sync')
      .description(
        `Regenerates all auto-generated types and specs from the current state of your application. This is the most commonly run command after making changes to models, serializers, controllers, or routes. It performs:
${INDENT}
${INDENT}  1. Database schema types (types/db.ts, types/dream.ts)
${INDENT}  2. OpenAPI specs from @OpenAPI decorated controller actions
${INDENT}  3. Application types (e.g. model association and serializer names)
${INDENT}  4. Any custom sync actions registered via \`on('cli:sync', async () => \\{\\})\` in conf/app.ts or initializers
${INDENT}
${INDENT}Run this after changing: associations, serializers, @OpenAPI decorators, routes, or enum types.`,
      )
      .option(
        '--ignore-errors',
        'skip integrity checks (e.g., missing migrations) and continue sync anyway. Useful when bootstrapping or debugging',
        false,
      )
      .option(
        '--schema-only',
        'only regenerate database schema types (types/db.ts, types/dream.ts), skipping OpenAPI, routes, and custom sync actions. Faster when you only changed the database schema',
        false,
      )
      .action(async (options: { ignoreErrors: boolean; schemaOnly: boolean }) => {
        await initializePsychicApp({ bypassDreamIntegrityChecks: options.ignoreErrors || options.schemaOnly })
        await PsychicBin.sync(options)
        process.exit()
      })

    program
      .command('watch')
      .description(
        `Watches your app source files for changes and automatically runs sync when modifications are detected. Useful during active development to keep types, OpenAPI specs, and route caches up to date without manually running \`pnpm psy sync\` after each change.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy watch             # watches ./src (default)
${INDENT}  pnpm psy watch ./src/app   # watches only the app directory`,
      )
      .argument('[dir]', 'the directory to watch for changes. Defaults to ./src')
      .action(async (dir?: string) => {
        await initializePsychicApp({ bypassDreamIntegrityChecks: true })
        Watcher.watch(dir)
      })

    program
      .command('post-sync')
      .description(
        'Internal command (do not run directly). Runs as the second stage of `sync` after types are rebuilt. The app must be reloaded between stages so that autogenerated files (e.g., OpenAPI specs, route caches) can leverage the updated types.',
      )
      .action(async () => {
        await initializePsychicApp()
        await PsychicBin.postSync()
        process.exit()
      })

    program
      .command('sync:routes')
      .description(
        'Regenerates the route cache file from your current route definitions. The cache powers autocomplete for the route helper and other route-aware tooling. This runs automatically as part of `pnpm psy sync` — only run it standalone if you need to update just the route cache.',
      )
      .action(async () => {
        await PsychicBin.syncRoutes()
      })

    program
      .command('sync:openapi')
      .description(
        'Regenerates openapi.json from the current @OpenAPI decorators on all Psychic controllers. This runs automatically as part of `pnpm psy sync` — only run it standalone if you need to update just the OpenAPI spec without regenerating types or routes.',
      )
      .action(async () => {
        await initializePsychicApp()
        await PsychicBin.syncOpenapiJson()
        process.exit()
      })

    program
      .command('diff:openapi')
      .description(
        `Compares the OpenAPI spec on the current branch against the main/master branch and displays a diff of changes. Useful for reviewing API contract changes in pull requests.
${INDENT}
${INDENT}Example:
${INDENT}  pnpm psy diff:openapi                    # show diff only
${INDENT}  pnpm psy diff:openapi --fail-on-breaking  # exit 1 if breaking changes detected (for CI)`,
      )
      .option(
        '-f, --fail-on-breaking',
        'exit with code 1 if breaking API changes are detected (removed endpoints, changed required fields, etc.). Useful as a CI gate to prevent accidental breaking changes',
        false,
      )
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
        process.exit()
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
      tableName?: string
      modelName?: string
    }
    columnsWithTypes: string[]
  }) {
    await generateResource(opts)
  }
}
