import colors from 'colorette'
import env from '../src/env'
import PsychicServer from '../src/server'
import { RouteConfig } from '../src/router/route-manager'

env.load()
;(async function () {
  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  const expressions = buildExpressions(routes)

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

  process.exit()
})()

function buildExpressions(routes: RouteConfig[]): [string, string][] {
  return routes.map((route, i) => {
    const method = route.httpMethod.toUpperCase()
    const numMethodSpaces = 8 - method.length

    const beginningOfExpression = `${route.httpMethod.toUpperCase()}${' '.repeat(numMethodSpaces)}${
      route.path
    }`
    const endOfExpression = route.controllerActionString

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

  return desiredSpaceCount + 3
}
