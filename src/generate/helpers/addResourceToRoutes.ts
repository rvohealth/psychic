import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import UnexpectedUndefined from '../../error/UnexpectedUndefined.js'
import psychicPath from '../../helpers/path/psychicPath.js'
import PsychicApp from '../../psychic-app/index.js'
import { ResourceMethods, ResourcesMethods } from '../../router/types.js'

const ROUTES_FUNCTION_OPENER = /^export [^(]+\(r: PsychicRouter\)[^{]*\{$/

/**
 * Declares the resource in the routes file. `onlyActions` is the actions
 * the run generated when it was given `--only` (the controller's list, so an
 * `--only` entry the resource has no action for is not routed), or
 * undefined without `--only`.
 */
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
    case 'changed':
      await fs.writeFile(routesFilePath, result.routes)
      break

    case 'alreadyDeclared':
      break

    case 'unparseable': {
      const relativeRoutesFilePath = path.relative(psychicApp.apiRoot, routesFilePath)
      const [failure, instruction] = result.resourceDeclared
        ? [
            `Could not update the route for ${route} in ${relativeRoutesFilePath}`,
            'Edit the route by hand so that it declares the resource once, with these actions, keeping any routes nested in it:',
          ]
        : [
            `Could not add the route for ${route} to ${relativeRoutesFilePath}`,
            'Add the route by hand, merging these blocks into any that already exist:',
          ]

      console.warn(`
${failure}:
  ${result.reason}

The file was left unchanged. ${instruction}

${routeLines(ancestors, resourceDeclaration.code, 2).join('\n')}
`)
      break
    }
  }
}

/**
 * Inserts the resource into the deepest block on its route that the routes
 * file already declares, writing only the wrapper blocks that are missing.
 *
 * Each segment of the route is looked up among the direct children (the
 * lines indented one level deeper) of its parent's block, so it is found
 * wherever it sits in that block, and a same-named block anywhere else in
 * the file is never touched. When a block declares a segment more than once
 * (as earlier versions of the generator did when adding to an older sibling
 * namespace), the resource goes beneath the declaration under which the most
 * of the rest of its route is already declared, or the first of them when
 * none holds more. A parent resource declared without a callback
 * (`r.resources('places')` or `r.resources('places', { only: [...] })`) is
 * converted to the callback form, keeping its options, only when the new
 * resource is inserted into it.
 *
 * When the route already declares the resource, the declaration is kept where
 * it is and made to route the actions this run generated: its options become
 * `{ only: [...] }` listing them when the run had `--only`, or none without
 * it, replacing any `only` and `except` it had, and its callback, with the
 * routes nested in it, is kept.
 * The actions are compared, not the text, so a declaration already routing
 * them (in another order, or through `except`) is left as it is. A resource
 * declared more than once on the route, or with options other than `only` and
 * `except` lists of action names (e.g. a `controller`), is left unchanged and
 * reported, since editing one line could not make the route match the
 * regenerated controller.
 *
 * The scan skips `/* ... *\/` block comments, so a declaration commented out
 * that way is never found, edited or counted, and it never edits a line that
 * holds a block comment; such a line declaring a block on the route outside
 * its comment is reported.
 *
 * The scan assumes a prettier-formatted file: 2-space indentation, single-line
 * call openers, and `r => {` callbacks. When the routes function is indented
 * with tabs, or a block on the route is declared in a form it cannot edit, it
 * changes nothing and reports why, rather than writing a second block beside
 * the one it could not read.
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

  const routesFunction = findBlock(lines, routesFunctionIndex, '}')
  if (!routesFunction) return unclosedBlock(lines, routesFunctionIndex, '}')

  const routesFunctionBody = lines.slice(routesFunction.openerIndex + 1, routesFunction.closerIndex)
  if (routesFunctionBody.some(line => line.trim() !== '' && /^[ \t]*\t/.test(line)))
    return {
      outcome: 'unparseable',
      reason: 'the routes function is indented with tabs; the generator edits only 2-space indentation',
    }

  const placement = findPlacement(lines, routesFunction, ancestors, resourceDeclaration)

  switch (placement.outcome) {
    case 'unparseable':
      return placement

    case 'declared': {
      const [declaration, ...otherDeclarations] = placement.declarations
      if (declaration === undefined) throw new UnexpectedUndefined()
      if (otherDeclarations.length) return declaredMoreThanOnce(placement.declarations, resourceDeclaration)

      const actions = declaredActions(declaration.options, resourceDeclaration.method)
      if (!actions) return optionsNotRewritten(declaration, resourceDeclaration)
      if (sameActions(actions, resourceDeclaration.actions)) return { outcome: 'alreadyDeclared' }

      const code = declaration.hasCallback
        ? `${resourceDeclaration.code.slice(0, -1)}, r => {`
        : resourceDeclaration.code
      lines[declaration.lineIndex] = `${spaces(indentation(lines[declaration.lineIndex] ?? ''))}${code}`
      break
    }

    case 'convertParent': {
      const { parent, indent, missingAncestors } = placement
      lines.splice(
        parent.lineIndex,
        1,
        `${spaces(indent)}${parent.code.slice(0, -1)}, r => {`,
        ...routeLines(missingAncestors, resourceDeclaration.code, indent + 2),
        '',
        `${spaces(indent)}})`,
      )
      break
    }

    case 'insertIntoBlock': {
      const { block, missingAncestors } = placement
      lines.splice(
        block.openerIndex + 1,
        0,
        ...routeLines(missingAncestors, resourceDeclaration.code, block.indent + 2),
        '',
      )
      break
    }
  }

  return { outcome: 'changed', routes: lines.join('\n') }
}

/**
 * Where beneath the block the resource goes. When the block declares the
 * next segment of the route, the resource goes beneath that declaration; when
 * it declares that segment more than once, beneath the one under which the
 * most of the rest of the route is already declared, or the first of them on
 * a tie. When it declares none, the resource goes into the block itself,
 * inside every block of the route that is missing. `depth` counts the
 * segments of the route, the resource itself included, already declared
 * beneath the block.
 *
 * When the route already declares the resource, nothing is inserted: the
 * result lists every declaration of it on the route, in file order. A
 * declaration on the route the generator cannot read leaves the file
 * unparseable even then, since it may hold the parent the resource belongs in
 * or another declaration of the resource.
 */
function findPlacement(
  lines: string[],
  block: Block,
  ancestors: RouteAncestor[],
  resourceDeclaration: ResourceDeclaration,
): Placement | Declared | Unparseable {
  const [ancestor, ...remainingAncestors] = ancestors

  if (ancestor === undefined) {
    const declarations = findChildren(lines, block, resourceDeclaration.method, resourceDeclaration.name)

    const unrecognized = declarations.find(declaration => !declaration.recognized)
    if (unrecognized)
      return { ...unrecognizedDeclaration(unrecognized, resourceDeclaration), resourceDeclared: true }

    const recognized = declarations.filter(
      (declaration): declaration is RecognizedChild => declaration.recognized,
    )
    if (recognized.length) return { outcome: 'declared', declarations: recognized }

    return { outcome: 'insertIntoBlock', depth: 0, block, missingAncestors: [] }
  }

  let placement: Placement = { outcome: 'insertIntoBlock', depth: 0, block, missingAncestors: ancestors }
  let unparseable: Unparseable | undefined
  const resourceDeclarations: RecognizedChild[] = []

  for (const declaration of findChildren(lines, block, ancestor.method, ancestor.name)) {
    if (!declaration.recognized) {
      unparseable ??= unrecognizedDeclaration(declaration, ancestor)
      continue
    }

    let candidate: Placement

    if (declaration.hasCallback) {
      const childBlock = findBlock(lines, declaration.lineIndex, '})')
      if (!childBlock) {
        unparseable ??= unclosedBlock(lines, declaration.lineIndex, '})')
        continue
      }

      const nested = findPlacement(lines, childBlock, remainingAncestors, resourceDeclaration)
      if (nested.outcome === 'declared') {
        resourceDeclarations.push(...nested.declarations)
        continue
      }
      if (nested.outcome === 'unparseable') {
        unparseable ??= nested
        continue
      }

      candidate = { ...nested, depth: nested.depth + 1 }
    } else {
      candidate = {
        outcome: 'convertParent',
        depth: 1,
        parent: declaration,
        indent: block.indent + 2,
        missingAncestors: remainingAncestors,
      }
    }

    if (candidate.depth > placement.depth) placement = candidate
  }

  if (unparseable)
    return resourceDeclarations.length ? { ...unparseable, resourceDeclared: true } : unparseable
  if (resourceDeclarations.length) return { outcome: 'declared', declarations: resourceDeclarations }
  return placement
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
      actions: onlyActions ?? defaultActions(method),
      code: `r.${method}('${name}'${options ? `, ${options}` : ''})`,
    },
  }
}

/**
 * The actions a declaration with the given options routes, read as the router
 * reads them: its `only` list when it has one, else every default action not
 * in its `except` list. Undefined when the options hold anything but
 * single-line `only` and `except` lists of quoted action names (e.g. a
 * `controller`, or a variable), which the generator does not rewrite.
 */
function declaredActions(options: string | undefined, method: ResourceDeclaration['method']) {
  const lists: { only?: string[]; except?: string[] } = {}
  let unread = options?.slice(1, -1) ?? ''

  while (unread.trim() !== '') {
    const entry = /^\s*(only|except)\s*:\s*\[([^\]]*)\]\s*(?:,|$)/.exec(unread)
    if (!entry) return undefined

    const key = entry[1] === 'only' ? 'only' : 'except'
    const actions = actionNames(entry[2] ?? '')
    if (!actions || lists[key]) return undefined

    lists[key] = actions
    unread = unread.slice(entry[0].length)
  }

  return lists.only ?? defaultActions(method).filter(action => !lists.except?.includes(action))
}

/**
 * The action names in the text between the brackets of an `only` or `except`
 * list, or undefined when any item is not a quoted name.
 */
function actionNames(list: string) {
  const items = list.split(',').map(item => item.trim())
  if (items.at(-1) === '') items.pop()

  const names = items.map(item => /^(?:'(\w+)'|"(\w+)")$/.exec(item)).map(match => match?.[1] ?? match?.[2])
  return names.every((name): name is string => name !== undefined) ? names : undefined
}

function defaultActions(method: ResourceDeclaration['method']): readonly string[] {
  return method === 'resources' ? ResourcesMethods : ResourceMethods
}

function sameActions(actions: readonly string[], otherActions: readonly string[]) {
  const otherActionSet = new Set(otherActions)
  return new Set(actions).size === otherActionSet.size && actions.every(action => otherActionSet.has(action))
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
 * holding code outside block comments that is indented no deeper than the
 * opener, which must be the closer.
 */
function findBlock(lines: string[], openerIndex: number, closer: '}' | '})'): Block | undefined {
  const indent = indentation(lines[openerIndex] ?? '')
  const readCode = blockCommentReader()

  for (let index = openerIndex + 1; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if ((readCode(line) ?? line).trim() === '' || indentation(line) > indent) continue
    if (indentation(line) === indent && line.slice(indent).startsWith(closer))
      return { openerIndex, indent, closerIndex: index }
    return undefined
  }

  return undefined
}

function unclosedBlock(lines: string[], openerIndex: number, closer: '}' | '})'): Unparseable {
  return {
    outcome: 'unparseable',
    reason: `the block opened on line ${openerIndex + 1}, \`${(lines[openerIndex] ?? '').trim()}\`, has no \`${closer}\` closing it at the same indentation`,
  }
}

function declaredMoreThanOnce(
  declarations: RecognizedChild[],
  { method, name }: ResourceDeclaration,
): Unparseable {
  return {
    outcome: 'unparseable',
    resourceDeclared: true,
    reason: [
      `${method} '${name}' is declared more than once on the route, and the generator edits only a single declaration:`,
      ...declarations.map(({ lineIndex, code }) => `    line ${lineIndex + 1}: ${code}`),
    ].join('\n'),
  }
}

function optionsNotRewritten(
  { lineIndex, code }: RecognizedChild,
  { method, name }: ResourceDeclaration,
): Unparseable {
  return {
    outcome: 'unparseable',
    resourceDeclared: true,
    reason: `line ${lineIndex + 1}, \`${code}\`, declares ${method} '${name}' with options other than \`only\` and \`except\` lists of action names, which the generator does not rewrite`,
  }
}

function unrecognizedDeclaration(
  { lineIndex, code }: BlockChild,
  { method, name }: { method: RouteMethod; name: string },
): Unparseable {
  return {
    outcome: 'unparseable',
    reason: `line ${lineIndex + 1}, \`${code}\`, declares ${method} '${name}' in a form the generator does not edit`,
  }
}

/**
 * Every direct child of the block declaring `r.<method>('<name>'...`, in
 * file order. A declaration in one of the forms the generator writes or
 * converts is `recognized`; any other declaration of the same name (a call
 * split across lines, options spanning several lines, a callback naming its
 * router something other than `r`, code sharing its line with a block
 * comment) is returned unrecognized, so that it is never mistaken for an
 * absent block. A declaration inside a block comment is not a child.
 */
function findChildren(lines: string[], block: Block, method: RouteMethod, name: string): BlockChild[] {
  const childIndent = block.indent + 2
  const quotedName = `(?:'${escapeRegExp(name)}'|"${escapeRegExp(name)}")`
  const recognizedDeclaration = new RegExp(
    method === 'namespace'
      ? `^r\\.namespace\\(${quotedName}, r => \\{$`
      : `^r\\.${method}\\(${quotedName}(?:, (\\{.*\\}))?(\\)|, r => \\{)$`,
  )
  const declarationOpening = new RegExp(`^r\\.${method}\\(${quotedName}[,)]`)
  const nameOnItsOwnLine = new RegExp(`^${quotedName},?$`)
  const declares = (code: string, index: number) =>
    declarationOpening.test(code) ||
    (code === `r.${method}(` && nameOnItsOwnLine.test(nextNonBlankLine(lines, index)?.trim() ?? ''))
  const readCode = blockCommentReader()
  const children: BlockChild[] = []

  for (let index = block.openerIndex + 1; index < block.closerIndex; index++) {
    const line = lines[index] ?? ''
    const codeOutsideBlockComments = readCode(line)
    if (line.trim() === '' || indentation(line) !== childIndent) continue
    const code = line.slice(childIndent)

    // A line a block comment touches is never edited: a declaration on it
    // outside the comment is returned unrecognized, and one inside the comment
    // is commented out, so it is not a child at all.
    if (codeOutsideBlockComments !== undefined) {
      if (declares(codeOutsideBlockComments.trim(), index))
        children.push({ lineIndex: index, recognized: false, code })
      continue
    }

    const match = recognizedDeclaration.exec(code)
    if (match)
      children.push({
        lineIndex: index,
        recognized: true,
        code,
        options: match[1],
        hasCallback: method === 'namespace' || match[2] !== ')',
      })
    else if (declares(code, index)) children.push({ lineIndex: index, recognized: false, code })
  }

  return children
}

/**
 * Reads lines in file order, following `/* ... *\/` block comments from one
 * line to the next. For each line it returns the line's code with the block
 * comments removed when a block comment touches the line (the line starts
 * inside one, or one starts on it), and undefined when none does, so the
 * line is the code. A comment opened and closed on one line starts no
 * comment on the lines after it, code after the `*\/` closing a comment is
 * code, and a `/*` inside a quoted string or after `//` starts no comment.
 * A string continued across lines (a multi-line template literal) is not
 * followed.
 */
function blockCommentReader() {
  let inBlockComment = false

  return (line: string): string | undefined => {
    let touched = inBlockComment
    let code = ''
    let position = 0

    while (position < line.length) {
      if (inBlockComment) {
        const commentEnd = line.indexOf('*/', position)
        if (commentEnd === -1) break
        inBlockComment = false
        position = commentEnd + 2
        continue
      }

      const token = CODE_TOKEN.exec(line.slice(position))
      if (!token || token[0] === '//') {
        code += line.slice(position)
        break
      }

      const tokenStart = position + token.index
      if (token[0] === '/*') {
        touched = true
        inBlockComment = true
        code += line.slice(position, tokenStart)
        position = tokenStart + 2
      } else {
        code += line.slice(position, tokenStart + token[0].length)
        position = tokenStart + token[0].length
      }
    }

    return touched ? code : undefined
  }
}

/**
 * The first token on a line of code that changes how the rest of it is read:
 * a block comment opener, a line comment opener, or a quoted string.
 */
const CODE_TOKEN = /\/\*|\/\/|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/

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
  actions: readonly string[]
  code: string
}

interface Block {
  openerIndex: number
  indent: number
  closerIndex: number
}

interface RecognizedChild {
  lineIndex: number
  recognized: true
  code: string
  options: string | undefined
  hasCallback: boolean
}

type BlockChild = RecognizedChild | { lineIndex: number; recognized: false; code: string }

type Placement =
  | { outcome: 'insertIntoBlock'; depth: number; block: Block; missingAncestors: RouteAncestor[] }
  | {
      outcome: 'convertParent'
      depth: number
      parent: RecognizedChild
      indent: number
      missingAncestors: RouteAncestor[]
    }

interface Declared {
  outcome: 'declared'
  declarations: RecognizedChild[]
}

interface Unparseable {
  outcome: 'unparseable'
  reason: string
  resourceDeclared?: true
}

type InsertionResult = { outcome: 'changed'; routes: string } | { outcome: 'alreadyDeclared' } | Unparseable
