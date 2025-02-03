import { DreamBin } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import TypesBuilder from '../cli/helpers/TypesBuilder'
import generateController from '../generate/controller'
import generateResource from '../generate/resource'
import { isObject } from '../helpers/typechecks'
import OpenapiAppRenderer from '../openapi-renderer/app'
import PsychicApplication from '../psychic-application'
import PsychicServer from '../server'
import enumsFileStr from './helpers/enumsFileStr'
import generateRouteTypes from './helpers/generateRouteTypes'
import printRoutes from './helpers/printRoutes'

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

    if (!psychicApp.apiOnly) {
      await PsychicBin.syncOpenapiJson()
    }

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
    console.log(`syncing types/psychic.ts...`)

    await TypesBuilder.sync(customTypes)

    console.log(`done syncing types/psychic.ts!`)
  }

  public static async syncOpenapiJson() {
    console.log(`syncing openapi...`)

    await OpenapiAppRenderer.sync()

    console.log(`done syncing openapi!`)
  }

  public static async syncRoutes() {
    console.log('syncing routes...')

    const server = new PsychicServer()
    await server.boot()

    const routes = await server.routes()
    await generateRouteTypes(routes)

    console.log('done syncing routes!')
  }

  public static async syncClientEnums() {
    console.log('syncing client enums...')

    const psychicApp = PsychicApplication.getOrFail()
    const apiPath = path.join(psychicApp.clientRoot, psychicApp.client.apiPath)

    const enumsStr = await enumsFileStr()
    await fs.writeFile(`${apiPath}/enums.ts`, enumsStr)

    console.log('done syncing client enums!')
  }
}
