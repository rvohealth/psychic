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

  const matchesAndReplacements = addResourceToRoutes_routeToRegexAndReplacements(route, options)
  for (let index = 0; index < matchesAndReplacements.length; index++) {
    const matchAndReplacement = matchesAndReplacements[index]
    if (matchAndReplacement === undefined) throw new UnexpectedUndefined()

    if (matchAndReplacement.regex.test(routes)) {
      routes = routes.replace(
        matchAndReplacement.regex,
        matchAndReplacement.replacement +
          closeBrackets(index, indent(matchesAndReplacements.length - index - 1)) +
          '\n',
      )

      break
    }
  }

  await fs.writeFile(routesFilePath, routes)
}

export function addResourceToRoutes_routeToRegexAndReplacements(
  route: string,
  {
    singular,
    onlyActions,
  }: {
    singular: boolean
    onlyActions: string[] | undefined
  },
): RegexAndReplacement[] {
  const regexAndReplacements: RegexAndReplacement[] = []
  const namespaces = route.split('/')
  const resourceMethod = singular ? 'resource' : 'resources'
  const resourceName = namespaces.pop()
  const resourceOptions = onlyActions
    ? `, { only: ${JSON.stringify(onlyActions).replace(/"/g, "'").replace(/','/g, "', '")} }`
    : ''
  const resources = `  ${indent(namespaces.length)}r.${resourceMethod}('${resourceName}'${resourceOptions})`
  const replacement =
    namespaces.map((namespace, index) => `${indent(index + 1)}${namespaceCode(namespace)}\n`).join('') +
    resources +
    '\n'

  for (let index = namespaces.length - 1; index >= 0; index--) {
    const regexpString = namespaces
      .slice(0, index + 1)
      .map(
        (namespace, index) =>
          ` {${(index + 1) * 2}}${namespaceCode(namespace).replace(/([(){.])/g, '\\$1')}\n`,
      )
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

  return regexAndReplacements
}

interface RegexAndReplacement {
  regex: RegExp
  replacement: string
}

function namespaceCode(namespace: string) {
  return `r.namespace('${namespace}', r => {`
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
