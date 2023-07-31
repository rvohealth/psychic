import { IdType } from 'dream'
import { RouteTypes } from '../sync/routes'

export default function route(routePath: RouteTypes, ...interpolationArgs: IdType[]) {
  let route = routePath as string
  interpolationArgs.forEach(arg => {
    route = route.replace(/\/:[a-zA-Z-_]*/, `/${arg}` as string)
  })
  return route
}
