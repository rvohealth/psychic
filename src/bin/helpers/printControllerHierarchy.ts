import colors from 'yoctocolors'
import PsychicController from '../../controller/index.js'
import PsychicApp from '../../psychic-app/index.js'

const ROOT_CHILD_INDENT = 5
const MIN_DASHES = 2

export default function printControllerHierarchy(controllersPath?: string) {
  const lines = controllerHierarchyLines(controllersPath)
  for (const line of lines) {
    console.log(line)
  }
}

export function controllerHierarchyLines(controllersPath?: string): string[] {
  const psychicApp = PsychicApp.getOrFail()
  const resolvedPath = controllersPath ?? psychicApp.paths.controllers
  const allControllers = psychicApp.controllers

  const controllerClasses = Object.values(allControllers).filter(ctrl => {
    return ctrl.globalName.startsWith(globalPrefixFromPath(resolvedPath, psychicApp.paths.controllers))
  })

  const childrenMap = buildChildrenMap(controllerClasses)

  const roots = controllerClasses.filter(ctrl => Object.getPrototypeOf(ctrl) === PsychicController)

  if (roots.length === 0) {
    return ['No controllers found.']
  }

  const lines: string[] = []
  for (const root of roots) {
    collectTreeLines(
      root,
      childrenMap,
      { depth: 0, displayColumn: 0, strippedPrefix: '', baseIndent: 0 },
      lines,
      resolvedPath,
    )
  }
  return lines
}

export function buildChildrenMap(
  controllerClasses: (typeof PsychicController)[],
): Map<typeof PsychicController, (typeof PsychicController)[]> {
  const childrenMap = new Map<typeof PsychicController, (typeof PsychicController)[]>()

  for (const ctrl of controllerClasses) {
    const parent = Object.getPrototypeOf(ctrl) as typeof PsychicController
    if (!childrenMap.has(parent)) {
      childrenMap.set(parent, [])
    }
    childrenMap.get(parent)!.push(ctrl)
  }

  return childrenMap
}

export function controllerTreeLine(
  displayedName: string,
  depth: number,
  displayColumn: number,
  baseIndent: number,
): string {
  if (depth === 0) {
    return colors.cyan(displayedName)
  }

  const numDashes = Math.max(MIN_DASHES, displayColumn - baseIndent - 2)
  const indentation = ' '.repeat(baseIndent)
  const dashes = '─'.repeat(numDashes)

  return `${indentation}└${dashes} ${colors.cyan(displayedName)}`
}

/**
 * Computes the actual column where the name starts on screen,
 * accounting for MIN_DASHES potentially pushing the name further right.
 */
export function actualDisplayColumn(displayColumn: number, depth: number, baseIndent: number): number {
  if (depth === 0) return displayColumn
  const numDashes = Math.max(MIN_DASHES, displayColumn - baseIndent - 2)
  return baseIndent + numDashes + 2
}

export function sharedDirPrefix(a: string, b: string): string {
  const aParts = a.split('/')
  const bParts = b.split('/')
  let shared = ''
  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    if (aParts[i] === bParts[i]) {
      shared += aParts[i] + '/'
    } else {
      break
    }
  }
  return shared
}

export function globalPrefixFromPath(path: string, defaultControllersPath: string): string {
  if (path === defaultControllersPath) return 'controllers/'

  const normalized = path.replace(/\/$/, '')
  const defaultNormalized = defaultControllersPath.replace(/\/$/, '')

  if (normalized.startsWith(defaultNormalized + '/')) {
    const suffix = normalized.slice(defaultNormalized.length + 1)
    return `controllers/${suffix}/`
  }

  return 'controllers/'
}

/**
 * Returns the directory portion of a globalName.
 * e.g. "controllers/Admin/AuthedController" -> "controllers/Admin/"
 *      "controllers/ApplicationController" -> "controllers/"
 */
export function globalNameDir(globalName: string): string {
  const lastSlash = globalName.lastIndexOf('/')
  if (lastSlash === -1) return ''
  return globalName.slice(0, lastSlash + 1)
}

/**
 * Returns the parent directory of a directory path.
 * e.g. "controllers/Admin/" -> "controllers/"
 *      "controllers/" -> ""
 */
export function parentOfDir(dir: string): string {
  const withoutTrailing = dir.slice(0, -1)
  const lastSlash = withoutTrailing.lastIndexOf('/')
  if (lastSlash === -1) return ''
  return withoutTrailing.slice(0, lastSlash + 1)
}

/**
 * Checks whether a child controller violates the hierarchy convention.
 * A controller should extend a controller in the same directory or the parent directory.
 * Returns a warning message string if violated, or null if OK.
 */
export function hierarchyViolation(
  childGlobalName: string,
  parentGlobalName: string,
  controllersPath: string,
): string | null {
  const childDir = globalNameDir(childGlobalName)
  const parentControllerDir = globalNameDir(parentGlobalName)

  if (childDir === parentControllerDir || parentOfDir(childDir) === parentControllerDir) {
    return null
  }

  const childFilePath = controllersPath + '/' + childGlobalName.replace(/^controllers\//, '') + '.ts'
  return `[hierarchy violation: ${childFilePath} should extend the BaseController in its directory or be moved]`
}

function collectTreeLines(
  controller: typeof PsychicController,
  childrenMap: Map<typeof PsychicController, (typeof PsychicController)[]>,
  {
    depth,
    displayColumn,
    strippedPrefix,
    baseIndent,
  }: {
    depth: number
    displayColumn: number
    strippedPrefix: string
    baseIndent: number
  },
  lines: string[],
  controllersPath: string,
) {
  const displayedName = controller.globalName.slice(strippedPrefix.length)
  lines.push(controllerTreeLine(displayedName, depth, displayColumn, baseIndent))

  // The actual column where the name appears on screen (may differ from displayColumn
  // when MIN_DASHES pushes the name further right)
  const effectiveDisplayColumn = actualDisplayColumn(displayColumn, depth, baseIndent)

  if (depth > 0) {
    const parentClass = Object.getPrototypeOf(controller) as typeof PsychicController
    if (parentClass !== PsychicController) {
      const violation = hierarchyViolation(controller.globalName, parentClass.globalName, controllersPath)
      if (violation) {
        const warningIndent = ' '.repeat(effectiveDisplayColumn)
        lines.push(warningIndent + colors.yellow(violation))
      }
    }
  }

  const childBaseIndent = depth === 0 ? ROOT_CHILD_INDENT : effectiveDisplayColumn - 1

  const children = childrenMap.get(controller) ?? []
  for (const child of children) {
    const shared = sharedDirPrefix(controller.globalName, child.globalName)
    const childDisplayColumn = effectiveDisplayColumn + shared.length - strippedPrefix.length

    collectTreeLines(
      child,
      childrenMap,
      {
        depth: depth + 1,
        displayColumn: childDisplayColumn,
        strippedPrefix: shared,
        baseIndent: childBaseIndent,
      },
      lines,
      controllersPath,
    )
  }
}
