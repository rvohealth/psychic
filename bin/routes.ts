import env from '../src/env'
import PsychicServer from '../src/server'

env.load()
;(async function () {
  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  routes.forEach(route => {
    const method = route.httpMethod.toUpperCase()
    const numMethodSpaces = 8 - method.length

    const beginningOfExpression = `${route.httpMethod.toUpperCase()}${' '.repeat(numMethodSpaces)}${
      route.path
    }`
    const endOfExpression = route.controllerActionString
    const desiredSpaceCount = 110
    const spaces = ' '.repeat(desiredSpaceCount - beginningOfExpression.length - endOfExpression.length)
    console.log(`${beginningOfExpression}${spaces}${endOfExpression}`)
  })
  process.exit()
})()
