import { uniq } from '@rvohealth/dream'
import '../helpers/loadEnv'
import fs from 'fs/promises'
import PsychicServer from '../server'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import { RouteConfig } from '../router/route-manager'

async function syncRoutes() {
  console.log('syncing routes...')

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
