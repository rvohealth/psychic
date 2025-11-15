import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import UnexpectedUndefined from '../../error/UnexpectedUndefined.js'
import psychicPath from '../../helpers/path/psychicPath.js'
import PsychicApp from '../../psychic-app/index.js'

export default async function addResourceToRoutes(
  route: string,
  options: {
    singular: boolean
    onlyActions: string[] | undefined
  },
) {
  const psychicApp = PsychicApp.getOrFail()
  let routesFilePath = path.join(psychicApp.apiRoot, psychicPath('apiRoutes'))

  const adminRouteRegexp = /^\/?admin/
  if (adminRouteRegexp.test(route)) {
    const adminRoutesFilePath = routesFilePath.replace(/\.ts$/, '.admin.ts')
    if (fsSync.existsSync(adminRoutesFilePath)) routesFilePath = adminRoutesFilePath
  }

  let routes = (await fs.readFile(routesFilePath)).toString()

  const results = addResourceToRoutes_routeToRegexAndReplacements(routes, route, options)
  routes = results.routes
  const regexAndReplacements = results.regexAndReplacements

  for (let index = 0; index < regexAndReplacements.length; index++) {
    const matchAndReplacement = regexAndReplacements[index]
    if (matchAndReplacement === undefined) throw new UnexpectedUndefined()

    if (matchAndReplacement.regex.test(routes)) {
      routes = routes.replace(
        matchAndReplacement.regex,
        matchAndReplacement.replacement +
          closeBrackets(index, indent(regexAndReplacements.length - index - 1)) +
          '\n',
      )

      break
    }
  }

  await fs.writeFile(routesFilePath, routes)
}

export function addResourceToRoutes_routeToRegexAndReplacements(
  routes: string,
  route: string,
  {
    singular,
    onlyActions,
  }: {
    singular: boolean
    onlyActions: string[] | undefined
  },
): { routes: string; regexAndReplacements: RegexAndReplacement[] } {
  const regexAndReplacements: RegexAndReplacement[] = []
  const namespaces = route.split('/')
  const resourceMethod = singular ? 'resource' : 'resources'
  const resourceName = namespaces.pop()
  const resourceOptions = onlyActions
    ? `, { only: ${JSON.stringify(onlyActions).replace(/"/g, "'").replace(/','/g, "', '")} }`
    : ''

  let namespaceCounter = 0
  const pathParamRegexp = /^\{[^}]*\}$/

  const replacement =
    namespaces
      .map((pathPart, index) => {
        if (pathParamRegexp.test(pathPart)) return
        const nextPathPart = namespaces[index + 1]
        namespaceCounter++

        if (nextPathPart && pathParamRegexp.test(nextPathPart)) {
          /**
           * If the routes file still includes the initial `r.resources('resourceName')`,
           * then we replace it with the `r.resources('resourceName', r => {})` form
           */
          routes = routes.replace(
            `${indent(namespaceCounter)}r.resources('${pathPart}')`,
            `${indent(namespaceCounter)}${nestedResourcesCode(pathPart)}\n${indent(namespaceCounter)}})\n`,
          )

          return `${indent(namespaceCounter)}${nestedResourcesCode(pathPart)}\n`
        } else {
          return `${indent(namespaceCounter)}${namespaceCode(pathPart)}\n`
        }
      })
      .join('') +
    `  ${indent(namespaceCounter)}r.${resourceMethod}('${resourceName}'${resourceOptions})` +
    '\n'

  for (let index = namespaces.length - 1; index >= 0; index--) {
    const pathPart = namespaces[index + 1]
    if (pathPart && pathParamRegexp.test(pathPart)) continue
    namespaceCounter = 0

    const regexpString = namespaces
      .slice(0, index + 1)
      .map((pathPart, index) => {
        if (pathParamRegexp.test(pathPart)) return
        const nextPathPart = namespaces[index + 1]
        namespaceCounter++

        if (nextPathPart && pathParamRegexp.test(nextPathPart)) {
          return ` {${namespaceCounter * 2}}${nestedResourcesCode(pathPart).replace(/([(){.])/g, '\\$1')}\n`
        } else {
          return ` {${namespaceCounter * 2}}${namespaceCode(pathPart).replace(/([(){.])/g, '\\$1')}\n`
        }
      })
      .join('')

    regexAndReplacements.push({
      regex: new RegExp(`^${regexpString}`, 'm'),
      replacement,
    })
  }

  regexAndReplacements.push({
    regex: /^export ([^(]+)\(r: PsychicRouter\)([^{]*)\{\n/m,
    replacement: `export $1(r: PsychicRouter)$2{\n${replacement}`,
  })

  return { routes, regexAndReplacements }
}

interface RegexAndReplacement {
  regex: RegExp
  replacement: string
}

function namespaceCode(namespace: string) {
  return `r.namespace('${namespace}', r => {`
}

function nestedResourcesCode(namespace: string) {
  return `r.resources('${namespace}', r => {`
}

function closeBrackets(number: number, baseIndentation: string) {
  let closBrackets = ''

  for (let i = number; i > 0; i--) {
    closBrackets += `${baseIndentation}${indent(i)}})\n`
  }

  return closBrackets
}

function indent(number: number) {
  let spaces = ''

  for (let i = 0; i < number; i++) {
    spaces += '  '
  }

  return spaces
}
