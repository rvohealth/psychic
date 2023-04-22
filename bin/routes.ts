import env from '../src/env'
import PsychicServer from '../src/server'

env.load()

if (process.env.CORE_DEVELOPMENT === '1') {
} else {
  process.env.OVERRIDDEN_ROOT_PATH = process.cwd() + '/../../src'
}

;(async function () {
  const server = new PsychicServer()
  await server.boot()

  const routes = await server.routes()
  routes.forEach(route => {
    const beginningOfExpression = `${route.httpMethod.toUpperCase()} ${route.path}`
    const endOfExpression = route.controllerActionString
    const desiredSpaceCount = 110
    const spaces = ' '.repeat(desiredSpaceCount - beginningOfExpression.length - endOfExpression.length)
    console.log(`${beginningOfExpression}${spaces}${endOfExpression}`)
  })
  process.exit()
})()
