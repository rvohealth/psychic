import { IdType } from '@rvoh/dream'
import { RouteTypes } from '../../conf/routeTypes.js'

export default function route(routePath: RouteTypes, ...interpolationArgs: IdType[]) {
  let route = routePath as string
  interpolationArgs.forEach(arg => {
    route = route.replace(/\/:[a-zA-Z-_]*/, `/${arg}`)
  })
  return route
}
