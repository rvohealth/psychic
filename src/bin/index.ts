import { DreamBin, DreamCLI } from '@rvoh/dream'
import * as fs from 'fs/promises'
import * as path from 'path'
import TypesBuilder from '../cli/helpers/TypesBuilder.js'
import generateController from '../generate/controller.js'
import generateResource from '../generate/resource.js'
import { isObject } from '../helpers/typechecks.js'
import OpenapiAppRenderer from '../openapi-renderer/app.js'
import PsychicApplication from '../psychic-application/index.js'
import PsychicServer from '../server/index.js'
import enumsFileStr from './helpers/enumsFileStr.js'
import generateRouteTypes from './helpers/generateRouteTypes.js'
import printRoutes from './helpers/printRoutes.js'

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
    const psychicApp = PsychicApplication.getOrFail()
    await PsychicBin.syncOpenapiJson()

    if (psychicApp.openapi?.syncEnumsToClient) {
      await this.syncClientEnums()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let output: any = {}

    for (const hook of psychicApp.specialHooks.sync) {
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
    const spinner = DreamCLI.logger.log(`syncing types/psychic.ts...`, { spinner: true })

    await TypesBuilder.sync(customTypes)

    spinner.stop()
  }

  public static async syncOpenapiJson() {
    const spinner = DreamCLI.logger.log(`syncing openapi...`, { spinner: true })

    await OpenapiAppRenderer.sync()

    spinner.stop()
  }

  public static async syncRoutes() {
    const spinner = DreamCLI.logger.log(`syncing routes...`, { spinner: true })

    const server = new PsychicServer()
    await server.boot()

    const routes = await server.routes()
    await generateRouteTypes(routes)

    spinner.stop()
  }

  public static async syncClientEnums() {
    const spinner = DreamCLI.logger.log(`syncing client enums...`, { spinner: true })

    const psychicApp = PsychicApplication.getOrFail()
    const apiPath = path.join(psychicApp.clientRoot, psychicApp.client.apiPath)

    const enumsStr = await enumsFileStr()
    await fs.writeFile(`${apiPath}/enums.ts`, enumsStr)

    spinner.stop()
  }
}
