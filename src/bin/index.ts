import { CliFileWriter, DreamBin, DreamCLI } from '@rvoh/dream/system'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import ASTPsychicTypesBuilder from '../cli/helpers/ASTPsychicTypesBuilder.js'
import validateOpenapiName from '../cli/helpers/validateOpenapiName.js'
import generateController from '../generate/controller.js'
import generateResource from '../generate/resource.js'
import EnvInternal from '../helpers/EnvInternal.js'
import isObject from '../helpers/isObject.js'
import OpenapiAppRenderer from '../openapi-renderer/app.js'
import PsychicApp from '../psychic-app/index.js'
import enumsFileStr from './helpers/enumsFileStr.js'
import generateRouteTypes from './helpers/generateRouteTypes.js'
import { OpenApiSpecDiff, PsychicOpenapiConfig } from './helpers/OpenApiSpecDiff.js'
import printControllerHierarchy, {
  controllerHierarchyViolations,
} from './helpers/printControllerHierarchy.js'
import printRoutes from './helpers/printRoutes.js'

export {
  BreakingChangesDetectedInOpenApiSpecError,
  OpenApiSpecDiffToolFailureError,
} from './helpers/OpenApiSpecDiff.js'

export default class PsychicBin {
  public static async generateController(controllerName: string, actions: string[]) {
    await generateController({
      fullyQualifiedControllerName: controllerName,
      actions,
      singular: false,
    })
  }

  public static async generateResource(
    route: string,
    fullyQualifiedModelName: string,
    columnsWithTypes: string[],
    options: {
      singular: boolean
      onlyActions?: string
      stiBaseSerializer: boolean
      owningModel?: string
      connectionName: string
      modelName?: string
      tableName?: string
      softDelete: boolean
    },
  ) {
    await generateResource({ route, fullyQualifiedModelName, columnsWithTypes, options })
  }

  public static printRoutes() {
    printRoutes()
  }

  public static printControllerHierarchy(controllersPath?: string) {
    printControllerHierarchy(controllersPath)
  }

  public static controllerHierarchyViolations(controllersPath?: string): string[] {
    return controllerHierarchyViolations(controllersPath)
  }

  public static async sync({
    bypassDreamSync = false,
    schemaOnly = false,
  }: { bypassDreamSync?: boolean; schemaOnly?: boolean } = {}) {
    if (!EnvInternal.isTest) {
      DreamCLI.logger.logStartProgress(
        `skipping sync: auto-generated type/schema files are only built when NODE_ENV=test (current NODE_ENV: ${process.env.NODE_ENV ?? 'unset'}). Run with NODE_ENV=test to regenerate.`,
      )
      DreamCLI.logger.logEndProgress()
      return
    }

    if (!bypassDreamSync) await DreamBin.sync(() => {}, { schemaOnly })

    if (schemaOnly) return

    await PsychicBin.syncTypes()

    const psychicApp = PsychicApp.getOrFail()
    DreamCLI.logger.logStartProgress('running post-sync operations...')

    // call post-sync command in a separate process, so that newly-generated
    // types can be reloaded and brought into all classes.
    const { command, args } = psychicApp.psyCmd('post-sync')
    await DreamCLI.spawn(command, {
      args,
      onStdout: message => {
        DreamCLI.logger.logContinueProgress(`[post-sync]` + ' ' + message, {
          logPrefixColor: 'greenBright',
        })
      },
    })

    DreamCLI.logger.logEndProgress()
  }

  public static async postSync() {
    if (!EnvInternal.isTest) {
      DreamCLI.logger.logStartProgress(
        `skipping post-sync: auto-generated type/schema files are only built when NODE_ENV=test (current NODE_ENV: ${process.env.NODE_ENV ?? 'unset'}). Run with NODE_ENV=test to regenerate.`,
      )
      DreamCLI.logger.logEndProgress()
      return
    }

    await this.syncOpenapiJson()
    await this.runCliHooksAndUpdatePsychicTypesFileWithOutput()
    await this.syncOpenapiTypescriptFiles()
  }

  public static async syncTypes() {
    await new ASTPsychicTypesBuilder().build()
  }

  public static openapiDiff() {
    const psychicApp = PsychicApp.getOrFail()
    const openapiConfigsWithCheckDiffs = Object.entries(psychicApp.openapi).filter(
      ([, config]: [string, PsychicOpenapiConfig]) => config.checkDiffs,
    )

    OpenApiSpecDiff.compare(openapiConfigsWithCheckDiffs)
  }

  public static async syncOpenapiTypescriptFiles() {
    DreamCLI.logger.logStartProgress(`syncing openapi types...`)

    // https://rvohealth.atlassian.net/browse/PDTC-8359
    // by dynamically importing this file, we prevent both openapi-typescript
    // and typescript from being required as dependencies, since in production
    // environments these won't be installed. By running migrations with
    // --skip-sync, this function will never run, preventing the file which
    // requires the dev dependencies from ever being imported.
    const syncOpenapiTypescriptFiles = (await import('./helpers/syncOpenapiTypescriptFiles.js')).default

    await syncOpenapiTypescriptFiles()
    DreamCLI.logger.logEndProgress()
  }

  public static async syncOpenapiJson() {
    DreamCLI.logger.logStartProgress(`syncing openapi...`)
    await OpenapiAppRenderer.sync()
    DreamCLI.logger.logEndProgress()
  }

  public static async syncRoutes() {
    DreamCLI.logger.logStartProgress(`syncing routes...`)

    await generateRouteTypes(PsychicApp.getOrFail().routesCache)

    DreamCLI.logger.logEndProgress()
  }

  /**
   * Syncs the client enums file for the OpenAPI spec registered under
   * `openapiName` (default: `'default'`), writing one exported const per pg
   * enum that actually appears in that spec's rendered surface. The enum
   * collection itself renders the spec in memory and requires no database
   * connection.
   *
   * The spec-scoped export set is an information-disclosure boundary: the
   * generated file is client-visible surface, so an enum or value the spec
   * does not render is deliberately absent — widen the spec, don't route
   * around the file.
   *
   * An unregistered `openapiName` throws before anything is written —
   * otherwise the render would silently produce a skeleton document and
   * overwrite the client enums file with an empty module.
   */
  public static async syncClientEnums(outfile: string, openapiName: string = 'default') {
    validateOpenapiName(openapiName)

    DreamCLI.logger.logStartProgress(`syncing client enums...`)

    const enumsStr = enumsFileStr(openapiName)

    try {
      const dir = path.dirname(outfile)
      await fs.mkdir(dir, { recursive: true })
    } catch {
      // noop
    }

    await CliFileWriter.write(outfile, enumsStr)

    DreamCLI.logger.logEndProgress()
  }

  /**
   * @internal
   *
   * runs all the custom cli hooks provided for the user's application.
   * if any of the cli hooks returns an object-based output, we will splat
   * it all together into a single `output` variable, which we then
   * feed into the `syncTypes` method to provide custom type data.
   * This enables psychic plugins to add custom types to the psychic type
   * bindings.
   */
  private static async runCliHooksAndUpdatePsychicTypesFileWithOutput() {
    const psychicApp = PsychicApp.getOrFail()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let output: any = {}

    for (const hook of psychicApp.specialHooks.cliSync) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const res = await hook()
      if (isObject(res)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        output = { ...output, ...(res as object) }
      }
    }
  }
}
