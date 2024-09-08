import path from 'path'
import generateController from '../generate/controller'
import generateResource from '../generate/resource'
import openapiJsonPath from '../helpers/openapiJsonPath'
import sspawn from '../helpers/sspawn'
import OpenapiAppRenderer from '../openapi-renderer/app'
import PsychicApplication from '../psychic-application'
import PsychicServer from '../server'
import generateRouteTypes from './helpers/generateRouteTypes'
import printRoutes from './helpers/printRoutes'

export default class PsychicBin {
  public static async generateController(route: string, controllerName: string, actions: string[]) {
    await generateController(route, controllerName, actions)
  }

  public static async generateResource(route: string, modelName: string, columnsWithTypes: string[]) {
    await generateResource(route, modelName, columnsWithTypes)
  }

  public static async routes() {
    await printRoutes()
  }

  public static async syncOpenapiJson() {
    console.log(`syncing ${openapiJsonPath()}...`)

    await OpenapiAppRenderer.sync()

    console.log(`done syncing ${openapiJsonPath()}!`)
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
    const clientApiSchemaFilename = psychicApp.openapi?.clientOutputFilename

    await sspawn(
      `npx openapi-typescript ${psychicApp.apiRoot}/openapi.json -o ${apiPath}/${clientApiSchemaFilename}`,
    )

    console.log('done syncing client api schema!')
  }
}
