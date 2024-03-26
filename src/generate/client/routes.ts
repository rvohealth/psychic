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
export default apiRoutes`
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

function recursivelyBuildRoutesStr(routesObj: any, str: string, numIterations: number) {
  Object.keys(routesObj).forEach(key => {
    if (typeof routesObj[key] === 'string') {
      const pathStr = /^\(/.test(routesObj[key]) ? routesObj[key] : `'${routesObj[key]}'`

      str += `\n${spaces(numIterations)}${key}: ${pathStr},`
    } else {
      str += `
${spaces(numIterations)}${camelize(key)}: {`
      str = recursivelyBuildRoutesStr(routesObj[key], str, numIterations + 1)
      str += `\n${spaces(numIterations)}},`
    }
  })

  return str
}

function clientPathFunc(paramSegments: string[], segments: string[]) {
  return `\
({ ${paramSegments.map(segment => segment.replace(/^:/, '')).join(', ')} }: { ${paramSegments
    .map(segment => segment.replace(/^:/, '') + ': string')
    .join(', ')} }) => \`/${segments
    .map(segment => (/^:/.test(segment) ? `\$\{${segment.replace(/^:/, '')}\}` : segment))
    .join('/')
    .replace(/^\//, '')}\``
}

function clientPathStr(path: string) {
  return `/${path.replace(/^\//, '')}`
}
