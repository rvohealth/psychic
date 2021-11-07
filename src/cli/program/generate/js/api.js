import fs from 'fs'
import l from 'src/singletons/l'
import CrystalBall from 'src/crystal-ball'
import File from 'src/helpers/file'
import Dir from 'src/helpers/dir'
import config from 'src/config'
import path from 'path'

export default class GenerateJSAPI {
  async generate() {
    await Dir.mkdirUnlessExists(config.psyJsPath)
    await Dir.mkdirUnlessExists(path.join(config.psyJsPath, 'net'))

    await this.generateForRoutes(CrystalBall.routes)
    // await this.generateForNamespaces(CrystalBall.namespaces)
    if (!process.env.CORE_TEST)
      return process.exit()
  }

  // recursively read all nested namespaces
  // this looks like it should be broken, investigate later!
  async generateForNamespaces(namespaces) {
    // for (const namespace in Object.keys(namespaces)) {
    //   await this.generateForNamespaces(namespaces[namespace].namespaces)
    // }
  }

  async generateForRoutes(routes) {
    const files = {}
    for (const route of Object.values(routes)) {
      const pathSegments = this.pathSegments(route)
      const relativePath =
        (
          pathSegments.length > 0 ?
            pathSegments.join('/') + '/' :
            ''
        ) +
        `${this.filename(route)}.js`
      const filePath = path.join(config.psyJsPath, 'net', relativePath)

      let _path = path.join(config.psyJsPath, 'net')
      let index = 0
      for (const segment of pathSegments) {
        const isFilename = index === route.parsed.segments.length
        _path += `/${segment}`

        if (!isFilename && !fs.existsSync(path)) {
          l.log(`making dir ${path}...`)
          await Dir.mkdir(_path)
        }
        index++
      }

      l.log(`writing api file: ${relativePath.replace(/\.js$/, '')}.${this.routeMethodName(route)}...`)
      await File.unlinkIfExists(filePath)

      files[filePath] = files[filePath] || { route, endpoints: [] }
      files[filePath].endpoints.push(this.endpoint(route))
    }

    for (const fileName of Object.keys(files)) {
      const className = files[fileName].route.channel.name.replace(/Channel$/, '')
      const imports =
`\
import common from 'psy/net/common'

export default class ${className}API {
`
      const endpoints = files[fileName].endpoints
        .sort((a, b) => {
          if (a.methodName < b.methodName) return -1
          if (a.methodName > b.methodName) return 1
          return 0
        })
        .map(endpoint => endpoint.text)
        .join('\n')

      await File.write(
        fileName,
        imports +
          endpoints +
`\
}
`
      )
    }
  }

  filename(route) {
    return route.channel.paramName.replace(/-channel$/, '')
  }

  endpoint(route) {
    const params = this.params(route)
    let path = route.fullRoute
    route.parsed.params.forEach(param => {
      path = path.replace(`:${param.name}`, '${' + param.name +'}')
    })
    const methodName = this.routeMethodName(route)

    let text =
`\
  static ${methodName}(${params}) {
    return common.${route.httpMethod}(\`${path}\`, opts)
  }
`
    if (route.authKey)
      text =
`\
  static async ${methodName}(${params}) {
    const response = await common.${route.httpMethod}(\`${path}\`, opts)
    return response
  }
`

    return ({
      methodName,
      text,
    })
  }

  routeMethodName(route) {
    const methodName = route.isResource && ['put', 'patch'].includes(route.httpMethod) ?
      route.httpMethod :
      route.method
    return methodName.replace(/-channel$/, '')
  }

  params(route) {
    return route.parsed.params
      .concat({ name: 'opts' })
      .map(param => param.name)
      .join(', ')
  }

  pathSegments(route) {
    let pathSegments = route.parsed.segments
      .filter(segment => !/^:/.test(segment))

    // pop method from path
    pathSegments.pop()

    // if it belongs to a resource, path should segment both method and resource name,
    // so that /api/v1/users/auth
    // becomes /api/v1
    if (route.belongsToResource)
      pathSegments.pop()

    return pathSegments
  }
}
