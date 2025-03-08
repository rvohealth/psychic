import { uniq } from '@rvohealth/dream'
import * as fs from 'fs/promises'
import * as path from 'path'
import PsychicApplication from '../../psychic-application/index.js'
import { RouteConfig } from '../../router/route-manager.js'

export default async function generateRouteTypes(routes: RouteConfig[]) {
  const fileStr = `\
  export type RouteTypes =
  ${uniq(routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`)).join('\n')}
  `

  const psychicApp = PsychicApplication.getOrFail()
  const routeTypesPath = path.join(psychicApp.apiRoot, 'src/conf/routeTypes.ts')
  await fs.writeFile(routeTypesPath, fileStr)
}
