import { CliFileWriter, uniq } from '@rvoh/dream'
import * as path from 'node:path'
import PsychicApp from '../../psychic-app/index.js'
import { RouteConfig } from '../../router/route-manager.js'

export default async function generateRouteTypes(routes: RouteConfig[]) {
  const fileStr = `\
  export type RouteTypes =
  ${uniq(routes.map(routeConf => `  | '/${routeConf.path.replace(/^\//, '')}'`)).join('\n')}
  `

  const psychicApp = PsychicApp.getOrFail()
  const routeTypesPath = path.join(psychicApp.apiRoot, 'src', 'conf', 'routeTypes.ts')
  await CliFileWriter.write(routeTypesPath, fileStr)
}
