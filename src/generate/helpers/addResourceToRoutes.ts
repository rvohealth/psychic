import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import UnexpectedUndefined from '../../error/UnexpectedUndefined.js'
import psychicPath from '../../helpers/path/psychicPath.js'
import PsychicApp from '../../psychic-app/index.js'

const ROUTES_FUNCTION_OPENER = /^export [^(]+\(r: PsychicRouter\)[^{]*\{$/

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

  const internalRouteRegexp = /^\/?internal/
  if (internalRouteRegexp.test(route)) {
    const internalRoutesFilePath = routesFilePath.replace(/\.ts$/, '.internal.ts')
    if (fsSync.existsSync(internalRoutesFilePath)) routesFilePath = internalRoutesFilePath
  }

  const { ancestors, resourceDeclaration } = parseRoute(route, options)

  // Generators are not meant to be run in parallel, so a lost route, which happens only when two g:resource runs in one checkout read and rewrite the routes file at overlapping times and the later rewrite drops the other run's block, is an acceptable tradeoff for avoiding a lock file around this read and rewrite.
  const routes = (await fs.readFile(routesFilePath)).toString()
  const result = insertResourceIntoRoutes(routes, ancestors, resourceDeclaration)

  switch (result.outcome) {
    case 'inserted':
      await fs.writeFile(routesFilePath, result.routes)
      break

    case 'alreadyDeclared':
      break

    case 'unparseable':
      console.warn(`
Could not add the route for ${route} to ${path.relative(psychicApp.apiRoot, routesFilePath)}:
  ${result.reason}

The file was left unchanged. Add the route by hand, merging these blocks into any that already exist:

${routeLines(ancestors, resourceDeclaration.code, 2).join('\n')}
`)
      break
  }
}

/**
 * Inserts the resource into the deepest block on its route that the routes
 * file already declares, writing only the wrapper blocks that are missing.
 *
 * Each segment of the route is looked up among the direct children (the
 * lines indented one level deeper) of its parent's block, so it is found
 * wherever it sits in that block, and a same-named block anywhere else in
 * the file is never touched. A parent resource declared without a callback
 * (`r.resources('places')` or `r.resources('places', { only: [...] })`) is
 * converted to the callback form, keeping its options, only when the new
 * resource is inserted into it.
 *
 * The scan assumes a prettier-formatted file: 2-space indentation, single-line
 * call openers, and `r => {` callbacks. When a block on the route is declared
 * in a form it cannot edit, it changes nothing and reports why, rather than
 * writing a second block beside the one it could not read.
 */
function insertResourceIntoRoutes(
  routes: string,
  ancestors: RouteAncestor[],
  resourceDeclaration: ResourceDeclaration,
): InsertionResult {
  const lines = routes.split('\n')

  const routesFunctionIndex = lines.findIndex(line => ROUTES_FUNCTION_OPENER.test(line))
  if (routesFunctionIndex === -1)
    return {
      outcome: 'unparseable',
      reason: 'no `export ... (r: PsychicRouter) {` routes function was found',
    }

  let block = findBlock(lines, routesFunctionIndex, '}')
  if (!block) return unclosedBlock(lines, routesFunctionIndex, '}')

  let missingAncestors: RouteAncestor[] = []
  let convertedDeclaration: { lineIndex: number; indent: number; code: string } | undefined

  for (const [index, ancestor] of ancestors.entries()) {
    const child = findChild(lines, block, ancestor.method, ancestor.name)

    if (child === undefined) {
      missingAncestors = ancestors.slice(index)
      break
    }

    if (!child.recognized) return unrecognizedDeclaration(child, ancestor)

    if (!child.hasCallback) {
      convertedDeclaration = { lineIndex: child.lineIndex, indent: block.indent + 2, code: child.code }
      missingAncestors = ancestors.slice(index + 1)
      break
    }

    const childBlock = findBlock(lines, child.lineIndex, '})')
    if (!childBlock) return unclosedBlock(lines, child.lineIndex, '})')
    block = childBlock
  }

  if (convertedDeclaration) {
    const { lineIndex, indent, code } = convertedDeclaration
    lines.splice(
      lineIndex,
      1,
      `${spaces(indent)}${code.slice(0, -1)}, r => {`,
      ...routeLines(missingAncestors, resourceDeclaration.code, indent + 2),
      '',
      `${spaces(indent)}})`,
    )
  } else {
    if (!missingAncestors.length) {
      const existing = findChild(lines, block, resourceDeclaration.method, resourceDeclaration.name)
      if (existing && !existing.recognized) return unrecognizedDeclaration(existing, resourceDeclaration)
      if (existing && sameOptions(existing.options, resourceDeclaration.options))
        return { outcome: 'alreadyDeclared' }
    }

    lines.splice(
      block.openerIndex + 1,
      0,
      ...routeLines(missingAncestors, resourceDeclaration.code, block.indent + 2),
      '',
    )
  }

  return { outcome: 'inserted', routes: lines.join('\n') }
}

function parseRoute(
  route: string,
  { singular, onlyActions }: { singular: boolean; onlyActions: string[] | undefined },
): { ancestors: RouteAncestor[]; resourceDeclaration: ResourceDeclaration } {
  const pathParts = route.split('/')
  const name = pathParts.pop()
  if (name === undefined) throw new UnexpectedUndefined()
  const pathParamRegexp = /^\{[^}]*\}$/

  const ancestors: RouteAncestor[] = []
  pathParts.forEach((pathPart, index) => {
    if (pathParamRegexp.test(pathPart)) return
    const nextPathPart = pathParts[index + 1]
    const method = nextPathPart && pathParamRegexp.test(nextPathPart) ? 'resources' : 'namespace'
    ancestors.push({ method, name: pathPart })
  })

  const method = singular ? 'resource' : 'resources'
  const options = onlyActions
    ? `{ only: ${JSON.stringify(onlyActions).replace(/"/g, "'").replace(/','/g, "', '")} }`
    : undefined

  return {
    ancestors,
    resourceDeclaration: {
      method,
      name,
      options,
      code: `r.${method}('${name}'${options ? `, ${options}` : ''})`,
    },
  }
}

/**
 * The lines declaring the resource inside the given ancestors, each ancestor
 * written as a callback block, starting at the given indentation.
 */
function routeLines(ancestors: RouteAncestor[], resourceCode: string, indent: number) {
  return [
    ...ancestors.map((ancestor, index) => `${spaces(indent + index * 2)}${callbackOpener(ancestor)}`),
    `${spaces(indent + ancestors.length * 2)}${resourceCode}`,
    ...ancestors.map((_, index) => `${spaces(indent + index * 2)}})`).reverse(),
  ]
}

function callbackOpener({ method, name }: RouteAncestor) {
  return `r.${method}('${name}', r => {`
}

/**
 * The block opened on the given line: it ends at the first following line
 * that is indented no deeper than the opener, which must be the closer.
 */
function findBlock(lines: string[], openerIndex: number, closer: '}' | '})'): Block | undefined {
  const indent = indentation(lines[openerIndex] ?? '')

  for (let index = openerIndex + 1; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (line.trim() === '' || indentation(line) > indent) continue
    if (indentation(line) === indent && line.slice(indent).startsWith(closer))
      return { openerIndex, indent, closerIndex: index }
    return undefined
  }

  return undefined
}

function unclosedBlock(lines: string[], openerIndex: number, closer: '}' | '})'): InsertionResult {
  return {
    outcome: 'unparseable',
    reason: `the block opened on line ${openerIndex + 1}, \`${(lines[openerIndex] ?? '').trim()}\`, has no \`${closer}\` closing it at the same indentation`,
  }
}

function unrecognizedDeclaration(
  { lineIndex, code }: BlockChild,
  { method, name }: { method: RouteMethod; name: string },
): InsertionResult {
  return {
    outcome: 'unparseable',
    reason: `line ${lineIndex + 1}, \`${code}\`, declares ${method} '${name}' in a form the generator does not edit`,
  }
}

/**
 * The first direct child of the block declaring `r.<method>('<name>'...`.
 * A declaration in one of the forms the generator writes or converts is
 * `recognized`; any other declaration of the same name (a call split across
 * lines, options spanning several lines, a callback naming its router
 * something other than `r`) is returned unrecognized, so that it is never
 * mistaken for an absent block.
 */
function findChild(lines: string[], block: Block, method: RouteMethod, name: string): BlockChild | undefined {
  const childIndent = block.indent + 2
  const quotedName = `(?:'${escapeRegExp(name)}'|"${escapeRegExp(name)}")`
  const recognizedDeclaration = new RegExp(
    method === 'namespace'
      ? `^r\\.namespace\\(${quotedName}, r => \\{$`
      : `^r\\.${method}\\(${quotedName}(?:, (\\{.*\\}))?(\\)|, r => \\{)$`,
  )
  const declarationOpening = new RegExp(`^r\\.${method}\\(${quotedName}[,)]`)
  const nameOnItsOwnLine = new RegExp(`^${quotedName},?$`)

  for (let index = block.openerIndex + 1; index < block.closerIndex; index++) {
    const line = lines[index] ?? ''
    if (line.trim() === '' || indentation(line) !== childIndent) continue
    const code = line.slice(childIndent)

    const match = recognizedDeclaration.exec(code)
    if (match)
      return {
        lineIndex: index,
        recognized: true,
        code,
        options: match[1],
        hasCallback: method === 'namespace' || match[2] !== ')',
      }

    if (
      declarationOpening.test(code) ||
      (code === `r.${method}(` && nameOnItsOwnLine.test(nextNonBlankLine(lines, index)?.trim() ?? ''))
    )
      return { lineIndex: index, recognized: false, code }
  }

  return undefined
}

function sameOptions(existingOptions: string | undefined, options: string | undefined) {
  const normalize = (code: string | undefined) => (code ?? '').replace(/\s+/g, '').replace(/"/g, "'")
  return normalize(existingOptions) === normalize(options)
}

function nextNonBlankLine(lines: string[], index: number) {
  return lines.slice(index + 1).find(line => line.trim() !== '')
}

function indentation(line: string) {
  return line.length - line.trimStart().length
}

function spaces(count: number) {
  return ' '.repeat(count)
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type RouteMethod = 'namespace' | 'resources' | 'resource'

interface RouteAncestor {
  method: 'namespace' | 'resources'
  name: string
}

interface ResourceDeclaration {
  method: 'resources' | 'resource'
  name: string
  options: string | undefined
  code: string
}

interface Block {
  openerIndex: number
  indent: number
  closerIndex: number
}

type BlockChild =
  | { lineIndex: number; recognized: true; code: string; options: string | undefined; hasCallback: boolean }
  | { lineIndex: number; recognized: false; code: string }

type InsertionResult =
  | { outcome: 'inserted'; routes: string }
  | { outcome: 'alreadyDeclared' }
  | { outcome: 'unparseable'; reason: string }
