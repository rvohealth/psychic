import * as fs from 'fs/promises'
import * as path from 'path'
import psychicPath from '../../helpers/path/psychicPath'
import PsychicApplication from '../../psychic-application'

export default async function addResourceToRoutes(route: string) {
  const psychicApp = PsychicApplication.getOrFail()
  const routesFilePath = path.join(psychicApp.apiRoot, psychicPath('apiRoutes'))
  let routes = (await fs.readFile(routesFilePath)).toString()

  const matchesAndReplacements = addResourceToRoutes_routeToRegexAndReplacements(route)
  for (let index = 0; index < matchesAndReplacements.length; index++) {
    const matchAndReplacement = matchesAndReplacements[index]
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

export function addResourceToRoutes_routeToRegexAndReplacements(route: string): RegexAndReplacement[] {
  const regexAndReplacements: RegexAndReplacement[] = []
  const namespaces = route.split('/')
  const resources = `  ${indent(namespaces.length - 1)}r.resources('${namespaces.pop()}')`
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
    regex: /^export default \(r: PsychicRouter\) => \{\n/m,
    replacement: `export default (r: PsychicRouter) => {\n${replacement}`,
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
