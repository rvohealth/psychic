import fs from 'fs'
import l from 'src/singletons/l'
import CrystalBall from 'src/crystal-ball'

export default class GenerateJSAPI {
  generate() {
    if (!fs.existsSync('src/psy'))
      fs.mkdirSync('src/psy')

    if (!fs.existsSync('src/psy/api'))
      fs.mkdirSync('src/psy/api')

    this.generateForRoutes(CrystalBall.routes)
    this.generateForNamespaces(CrystalBall.namespaces)
  }

  // recursively read all nested namespaces
  // this looks like it should be broken, investigate later!
  generateForNamespaces(namespaces) {
    Object
      .keys(namespaces)
      .forEach(namespace => {
        this.generateForNamespaces(namespaces[namespace].namespaces)
      })
  }

  generateForRoutes(routes) {
    const files = {}
    Object
      .values(routes)
      .forEach(route => {
        const pathSegments = this.pathSegments(route)
        const relativePath =
          (
            pathSegments.length > 0 ?
              pathSegments.join('/') + '/' :
              ''
          ) +
          `${this.filename(route)}.js`
        const filePath = 'src/psy/api/' + relativePath

        let path = 'src/psy/api'
        pathSegments.forEach((segment, index) => {
          const isFilename = index === route.parsed.segments.length
          path += `/${segment}`

          if (!isFilename && !fs.existsSync(path)) {
            l.log(`making dir ${path}...`)
            fs.mkdirSync(path)
          }
        })

        l.log(`writing api file: ${relativePath.replace(/\.js$/, '')}.${this.routeMethodName(route)}...`)
        if (fs.existsSync(filePath))
          fs.unlinkSync(filePath)

        files[filePath] = files[filePath] || { route, endpoints: [] }
        files[filePath].endpoints.push(this.endpoint(route))
      })

    Object.keys(files)
      .forEach(fileName => {
        const className = files[fileName].route.channel.name.replace(/Channel$/, '')
        const imports =
`\
import common from 'psy/api/common'

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

        fs.writeFileSync(
          fileName,
          imports +
            endpoints +
`\
}
`
          )
      })
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

    return ({
      methodName,
      text:
`\
  static ${methodName}(${params}) {
    return common.${route.httpMethod}(\`${path}\`, opts)
  }
`
    })
  }

  routeMethodName(route) {
    const methodName = ['put', 'patch'].includes(route.httpMethod) ?
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
