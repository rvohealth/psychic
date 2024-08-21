import { uniq } from '@rvohealth/dream'
import fs from 'fs/promises'
import path from 'path'
import PsychicApplication from '../../psychic-application'
import { RouteConfig } from '../../router/route-manager'

export default async function generateRouteTypes(routes: RouteConfig[]) {
  const fileStr = `\
  export type RouteTypes =
  ${uniq(routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`)).join('\n')}
  `

  const psychicApp = PsychicApplication.getOrFail()
  const routeTypesPath = path.join(psychicApp.apiRoot, 'src/conf/routeTypes.ts')
  await fs.writeFile(routeTypesPath, fileStr)
}
