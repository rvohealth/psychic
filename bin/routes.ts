import * as colors from 'colorette'
import env from '../src/env'
import PsychicServer from '../src/server'

env.load()
;(async function () {
  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  routes.forEach((route, i) => {
    const method = route.httpMethod.toUpperCase()
    const numMethodSpaces = 8 - method.length

    const beginningOfExpression = `${route.httpMethod.toUpperCase()}${' '.repeat(numMethodSpaces)}${
      route.path
    }`
    const endOfExpression = route.controllerActionString
    const desiredSpaceCount = 110
    const spaces = ' '.repeat(
      Math.min(Math.max(desiredSpaceCount - beginningOfExpression.length - endOfExpression.length, 0), 110)
    )

    const expression = `${beginningOfExpression}${spaces}${endOfExpression}`
    const colorizedExpression = i % 2 ? colors.bgWhite(colors.black(expression)) : expression
    console.log(colorizedExpression)
  })
  process.exit()
})()
