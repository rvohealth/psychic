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
  public static async generateController() {
    const route = process.argv[3]
    const name = process.argv[4]
    const indexOfTsNode = process.argv.findIndex(str => str === '--tsnode')
    const methods = indexOfTsNode ? process.argv.slice(5, indexOfTsNode) : process.argv.slice(5)
    await generateController(
      route,
      name,
      methods.filter(method => !['--core'].includes(method)),
    )
  }

  public static async generateResource() {
    const route = process.argv[3]
    const name = process.argv[4]
    const indexOfTsNode = process.argv.findIndex(str => str === '--tsnode')
    const args = indexOfTsNode ? process.argv.slice(5, indexOfTsNode) : process.argv.slice(5)
    await generateResource(route, name, args)
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
