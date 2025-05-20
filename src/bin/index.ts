import { DreamBin, DreamCLI } from '@rvoh/dream'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import TypesBuilder from '../cli/helpers/TypesBuilder.js'
import generateController from '../generate/controller.js'
import generateResource from '../generate/resource.js'
import { isObject } from '../helpers/typechecks.js'
import OpenapiAppRenderer from '../openapi-renderer/app.js'
import PsychicApp from '../psychic-app/index.js'
import PsychicServer from '../server/index.js'
import enumsFileStr from './helpers/enumsFileStr.js'
import generateRouteTypes from './helpers/generateRouteTypes.js'
import printRoutes from './helpers/printRoutes.js'
// import syncTypescriptOpenapiFiles from './helpers/syncTypescriptOpenapiFiles.js'

export default class PsychicBin {
  public static async generateController(controllerName: string, actions: string[]) {
    await generateController({ fullyQualifiedControllerName: controllerName, actions })
  }

  public static async generateResource(
    route: string,
    fullyQualifiedModelName: string,
    columnsWithTypes: string[],
  ) {
    await generateResource({ route, fullyQualifiedModelName, columnsWithTypes })
  }

  public static async routes() {
    await printRoutes()
  }

  public static async sync({ bypassDreamSync = false }: { bypassDreamSync?: boolean } = {}) {
    if (!bypassDreamSync) await DreamBin.sync(() => {})

    await PsychicBin.syncTypes()

    const psychicApp = PsychicApp.getOrFail()
    DreamCLI.logger.logStartProgress('running post-sync operations...')

    // call post-sync command in a separate process, so that newly-generated
    // types can be reloaded and brought into all classes.
    await DreamCLI.spawn(psychicApp.psyCmd('post-sync'), {
      onStdout: message => {
        DreamCLI.logger.logContinueProgress(`[post-sync]` + ' ' + message, {
          logPrefixColor: 'cyan',
        })
      },
    })

    DreamCLI.logger.logEndProgress()
  }

  public static async postSync() {
    const psychicApp = PsychicApp.getOrFail()
    await PsychicBin.syncOpenapiJson()

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

    if (Object.keys(output as object).length) {
      await PsychicBin.syncTypes(output)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async syncTypes(customTypes: any = undefined) {
    DreamCLI.logger.logStartProgress(`syncing types/psychic.ts...`)

    await TypesBuilder.sync(customTypes)

    DreamCLI.logger.logEndProgress()
  }

  // public static async syncTypescriptOpenapi() {
  //   DreamCLI.logger.logStartProgress(`syncing types/psychic.ts...`)
  //
  //   await syncTypescriptOpenapiFiles()
  //
  //   DreamCLI.logger.logEndProgress()
  // }
  //
  public static async syncOpenapiJson() {
    DreamCLI.logger.logStartProgress(`syncing openapi...`)

    await OpenapiAppRenderer.sync()

    DreamCLI.logger.logEndProgress()
  }

  public static async syncRoutes() {
    DreamCLI.logger.logStartProgress(`syncing routes...`)

    const server = new PsychicServer()
    await server.boot()

    const routes = await server.routes()
    await generateRouteTypes(routes)

    DreamCLI.logger.logEndProgress()
  }

  public static async syncClientEnums(outfile: string) {
    DreamCLI.logger.logStartProgress(`syncing client enums...`)

    const enumsStr = await enumsFileStr()

    try {
      const dir = path.dirname(outfile)
      await fs.mkdir(dir, { recursive: true })
    } catch {
      // noop
    }

    await fs.writeFile(outfile, enumsStr, {})

    DreamCLI.logger.logEndProgress()
  }
}
