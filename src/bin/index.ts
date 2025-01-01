import { DreamBin } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import generateController from '../generate/controller'
import generateResource from '../generate/resource'
import sspawn from '../helpers/sspawn'
import OpenapiAppRenderer from '../openapi-renderer/app'
import PsychicApplication from '../psychic-application'
import PsychicServer from '../server'
import enumsFileStr from './helpers/enumsFileStr'
import generateRouteTypes from './helpers/generateRouteTypes'
import printRoutes from './helpers/printRoutes'
import TypesBuilder from '../cli/helpers/TypesBuilder'

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

  public static async sync() {
    await DreamBin.sync()
    await PsychicBin.syncTypes()

    const psychicApp = PsychicApplication.getOrFail()

    if (!psychicApp.apiOnly) {
      await PsychicBin.syncOpenapiJson()
      await PsychicBin.syncOpenapiClientSchema()
    }

    if (psychicApp.openapi?.syncEnumsToClient) {
      await this.syncClientEnums()
    }

    for (const hook of psychicApp.specialHooks.sync) {
      await hook(psychicApp)
    }
  }

  public static async syncTypes() {
    console.log(`syncing types/psychic.ts...`)

    await TypesBuilder.sync()

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

  public static async syncOpenapiClientSchema() {
    console.log('syncing client api schema...')
    const psychicApp = PsychicApplication.getOrFail()

    const apiPath = path.join(psychicApp.clientRoot, psychicApp.client.apiPath)
    for (const openapiName in psychicApp.openapi) {
      const clientApiSchemaFilename = psychicApp.openapi[openapiName]?.clientOutputFilename

      if (clientApiSchemaFilename) {
        await sspawn(
          `npx openapi-typescript ${psychicApp.apiRoot}/openapi.json -o ${apiPath}/${clientApiSchemaFilename}`,
        )
      }
    }

    console.log('done syncing client api schema!')
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
