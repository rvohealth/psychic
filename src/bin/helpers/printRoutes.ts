import colors from 'yoctocolors'
import { ControllerActionRouteConfig, RouteConfig } from '../../router/route-manager.js'
import PsychicApp from '../../psychic-app/index.js'

export default function printRoutes() {
  const expressions = buildExpressions(PsychicApp.getOrFail().routesCache)

  // NOTE: intentionally doing this outside of the expression loop below
  // to avoid N+1
  const desiredFirstGapSpaceCount = calculateNumSpacesInFirstGap(expressions)
  const desiredLastGapSpaceCount = calculateNumSpacesInLastGap(expressions)

  expressions.forEach(([beginning, end], i) => {
    const partialExpression = `${beginning}${makeSpaces(beginning, desiredFirstGapSpaceCount)}${end}`
    const closingSpaces = makeSpaces(partialExpression, desiredLastGapSpaceCount)
    const expression = `${partialExpression}${closingSpaces}`
    const colorizedExpression = i % 2 ? colors.bgWhite(colors.black(expression)) : expression
    console.log(colorizedExpression)
  })
}

function buildExpressions(routes: RouteConfig[]): [string, string][] {
  return routes.map(route => {
    const formattedPath = '/' + route.path.replace(/^\//, '')
    const method = route.httpMethod.toUpperCase()
    const numMethodSpaces = 8 - method.length

    const beginningOfExpression = `${route.httpMethod.toUpperCase()}${' '.repeat(numMethodSpaces)}${
      formattedPath
    }`

    const controllerRouteConf = route as ControllerActionRouteConfig
    const endOfExpression = controllerRouteConf.controller
      ? controllerRouteConf.controller.controllerActionPath(controllerRouteConf.action)
      : 'middleware'

    return [beginningOfExpression, endOfExpression]
  })
}

function makeSpaces(expression: string, desiredCount: number) {
  return ' '.repeat(Math.max(desiredCount - expression.length, 1))
}

function calculateNumSpacesInFirstGap(expressions: [string, string][]) {
  let desiredSpaceCount = 0
  expressions.forEach(expression => {
    if (expression[0].length > desiredSpaceCount) desiredSpaceCount = expression[0].length
  })

  const gapSpaces = 3
  return desiredSpaceCount + gapSpaces
}

function calculateNumSpacesInLastGap(expressions: [string, string][]) {
  const desiredFirstGapSpaceCount = calculateNumSpacesInFirstGap(expressions)

  let desiredSpaceCount = 0
  expressions.forEach(([beginning, end]) => {
    const spaces = desiredFirstGapSpaceCount - beginning.length
    const expression = `${beginning}${spaces}${end}`
    if (expression.length > desiredSpaceCount) desiredSpaceCount = expression.length
  })

  return desiredSpaceCount
}
