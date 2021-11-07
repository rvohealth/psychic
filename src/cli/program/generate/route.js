import l from 'src/singletons/l'
import File from 'src/helpers/file'
import config from 'src/config'

class ArgsParser {
  get httpMethod() {
    return this.args[0]
  }

  get uri() {
    return this.args[1]
  }

  get controllerRouteMethodString() {
    return this.args[2]
  }

  get given() {
    return this.args.find(arg => {
      const [ key ] = arg.split(':')
      return key === 'given'
    }).split(':').last
  }

  constructor(args) {
    this.args = args
  }
}

export default class GenerateRoute {
  async generate(args) {
    const _args = new ArgsParser(args)
    await this._addRoute(_args)

    if (!process.env.CORE_TEST)
      return process.exit()
  }

  async _addRoute(args) {
    const newRoutes = await addRoute(args)
    await File.write(config.routesPath + '.js', newRoutes)
    l.log(`wrote new route to: ${config.routesPath}.js`)
  }
}

async function addRoute(args) {
  const routeFile = await File.read(config.routesPath + '.js')
  const lines = routeFile.toString().split("\n")

  let line =
`\
  r.${args.httpMethod}('${args.uri}', '${args.controllerRouteMethodString}')
`

  if (args.given)
    line =
`\
  r.given('${args.given}', () => {
    r.${args.httpMethod}('${args.uri}', '${args.controllerRouteMethodString}')
  })
`

  lines.insertBefore('}', line)
  return lines.join("\n")
}
