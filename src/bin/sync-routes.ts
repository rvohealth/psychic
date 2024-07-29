import { uniq } from '@rvohealth/dream'
import fs from 'fs/promises'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import '../helpers/loadEnv'
import Psyconf from '../psyconf'
import { RouteConfig } from '../router/route-manager'
import PsychicServer from '../server'

async function syncRoutes() {
  console.log('syncing routes...')

  await Psyconf.configure()

  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  await generateRouteTypes(routes)

  console.log('done syncing routes!')
  process.exit()
}

void syncRoutes()

async function generateRouteTypes(routes: RouteConfig[]) {
  const fileStr = `\
  export type RouteTypes =
  ${uniq(routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`)).join('\n')}
  `

  const routeTypesPath = absoluteSrcPath('conf/routeTypes.ts')
  await fs.writeFile(routeTypesPath, fileStr)
}
