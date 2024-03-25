import { camelize } from '@rvohealth/dream'
import { RouteConfig } from '../../router/route-manager'

export default async function generateClientRoutes(routes: RouteConfig[]) {
  let routesObj: any = {}
  routes.forEach(route => {
    const segments = route.path.replace(/^\//, '').split('/')
    const paramSegments = segments
      .filter(segment => /^:/.test(segment))
      .map(segment => segment.replace(/^:/, ''))
    const filteredSegments = segments.filter(segment => !/^:/.test(segment))

    routesObj = recursivelyBuildRoutesObj({ routesObj, segments, paramSegments, filteredSegments, route })
  })

  const str = recursivelyBuildRoutesStr(routesObj, '', 1)

  return `\
import { Inc, Decrement, PathValue, Path, ArrayPath } from './type-helpers'
const apiRoutes = {${str}
} as const
export default apiRoutes

type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: T[K] extends { path: any; method: string }
        ? [K]
        : [K, ...PathsToStringProps<T[K]>]
    }[Extract<keyof T, string>]

type JoinAllButLast<T extends string[], D extends string, Index extends number> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? Index extends T['length']
      ? \`\$\{F\}\$\{D\}\$\{T[Decrement<Index> & string & keyof T]\}\`
      : \`\$\{F\}\$\{D\}\$\{JoinAllButLast<Extract<R, string[]>, D, Inc<Index>>\}\`
    : never
  : string

type ParamsInterface = {
  [Key in JoinAllButLast<PathsToStringProps<typeof apiRoutes>, '.', 1> &
    (Path<typeof apiRoutes> | ArrayPath<typeof apiRoutes>)]: PathValue<
    typeof apiRoutes,
    Key & (Path<typeof apiRoutes> | ArrayPath<typeof apiRoutes>)
  >['path'] extends (...args: any) => any
    ? Parameters<
        PathValue<typeof apiRoutes, Key & (Path<typeof apiRoutes> | ArrayPath<typeof apiRoutes>)>['path']
      >
    : []
}

export type DottedApiRoutePathsToParams<T extends keyof ParamsInterface = keyof ParamsInterface> = [
  T,
  ParamsInterface[T],
]
`
}

function recursivelyBuildRoutesObj({
  routesObj,
  segments,
  paramSegments,
  filteredSegments,
  route,
}: {
  routesObj: any
  segments: string[]
  filteredSegments: string[]
  paramSegments: string[]
  route: RouteConfig
}) {
  let currObj = routesObj

  filteredSegments.forEach((routeSegment, index) => {
    currObj[routeSegment] ||= {}
    currObj = currObj[routeSegment]

    if (index === filteredSegments.length - 1) {
      const method = route.controllerActionString.split('#')[1]
      currObj[method] = {
        path: route.path.includes(':') ? clientPathFunc(paramSegments, segments) : clientPathStr(route.path),
        method: route.httpMethod,
      }
    }
  })

  return routesObj
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
    if (typeof routesObj[key]?.['path'] === 'string') {
      const pathStr = /^\(/.test(routesObj[key]['path'])
        ? routesObj[key]['path']
        : `'${routesObj[key]['path']}'`

      str += `\n${spaces(numIterations)}${camelize(key)}: {
${spaces(numIterations + 1)}path: ${pathStr},
${spaces(numIterations + 1)}method: '${routesObj[key]['method']}',
${spaces(numIterations)}},`
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
(${paramSegments.map(segment => segment.replace(/^:/, '') + ': string').join(', ')}) => \`/${segments
    .map(segment => (/^:/.test(segment) ? `\$\{${segment.replace(/^:/, '')}\}` : segment))
    .join('/')
    .replace(/^\//, '')}\``
}

function clientPathStr(path: string) {
  return `/${path.replace(/^\//, '')}`
}
