import * as colors from 'colorette'
import env from '../src/env'
import PsychicServer from '../src/server'
import { RouteConfig } from '../src/router/route-manager'

env.load()
;(async function () {
  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  const expressions = buildExpressions(routes)

  const desiredSpaceCount = calculateNumDesiredSpaces(expressions)

  expressions.forEach(([beginning, end], i) => {
    const spaces = ' '.repeat(desiredSpaceCount - beginning.length)
    const expression = `${beginning}${spaces}${end}`
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

function calculateNumDesiredSpaces(expressions: [string, string][]) {
  let desiredSpaceCount = 0
  expressions.forEach(expression => {
    if (expression[0].length > desiredSpaceCount) desiredSpaceCount = expression[0].length
  })

  const gapSpaces = 3
  return desiredSpaceCount + gapSpaces
}
