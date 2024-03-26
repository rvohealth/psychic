import { camelize } from '@rvohealth/dream'
import { RouteConfig } from '../../router/route-manager'

export default async function generateClientRoutes(routes: RouteConfig[]) {
  let routesObj: any = {}
  routes.forEach(route => {
    const segments = route.path.replace(/^\//, '').split('/')
    const paramSegments = segments
      .filter(segment => /^:/.test(segment))
      .map(segment => segment.replace(/^:/, ''))

    recursivelyBuildRoutesObj({ routesObj, segments, paramSegments, route })
  })

  const str = recursivelyBuildRoutesStr(routesObj, '', 1)

  return `\
const apiRoutes = {${str}
} as const
export default apiRoutes

export type UriParam = string | number`
}

function recursivelyBuildRoutesObj({
  routesObj,
  segments,
  paramSegments,
  route,
}: {
  routesObj: any
  segments: string[]
  paramSegments: string[]
  route: RouteConfig
}) {
  segments.reduce((currObj, routeSegment, index) => {
    const sanitizedSegment = routeSegment.replace(/^:/, '')
    currObj[sanitizedSegment] ||= {}
    currObj = currObj[sanitizedSegment]

    if (index === segments.length - 1) {
      currObj[route.httpMethod.toUpperCase()] = route.path.includes(':')
        ? clientPathFunc(paramSegments, segments)
        : clientPathStr(route.path)
    }

    return currObj
  }, routesObj)
}

function spaces(numIterations: number) {
  let spaces = ''
  for (let i = 0; i < numIterations; i++) {
    spaces += '  '
  }
  return spaces
}

function recursivelyBuildRoutesStr(routesObj: any, str: string, numIterations: number): string {
  return Object.keys(routesObj).reduce((agg, key) => {
    if (typeof routesObj[key] === 'string') {
      const pathStr = /^\(/.test(routesObj[key]) ? routesObj[key] : `'${routesObj[key]}'`

      agg += `\n${spaces(numIterations)}${key}: ${pathStr},`
    } else {
      agg += `
${spaces(numIterations)}${camelize(key)}: {`
      agg = recursivelyBuildRoutesStr(routesObj[key], agg, numIterations + 1)
      agg += `\n${spaces(numIterations)}},`
    }
    return agg
  }, str)
}

function clientPathFunc(paramSegments: string[], segments: string[]) {
  return `\
({ ${paramSegments.map(segment => segment.replace(/^:/, '')).join(', ')} }: { ${paramSegments
    .map(segment => segment.replace(/^:/, '') + ': UriParam')
    .join(', ')} }) => \`/${segments
    .map(segment => (/^:/.test(segment) ? `\$\{${segment.replace(/^:/, '')}\}` : segment))
    .join('/')
    .replace(/^\//, '')}\``
}

function clientPathStr(path: string) {
  return `/${path.replace(/^\//, '')}`
}
