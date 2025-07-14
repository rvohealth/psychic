import { RouteTypes } from '../../conf/routeTypes.js'

export default function route(routePath: RouteTypes, ...interpolationArgs: (string | bigint | number)[]) {
  let route = routePath as string
  interpolationArgs.forEach(arg => {
    route = route.replace(/\/:[a-zA-Z-_]*/, `/${arg}`)
  })
  return route
}
