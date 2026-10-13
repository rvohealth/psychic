import * as fs from 'node:fs'
import * as path from 'node:path'
import ts from 'typescript'

// typescript and openapi-typescript are devDependencies (openapi-typescript
// also an optional peer), so a production install does not have them. An app
// imports @rvoh/psychic/system in production (e.g. for I18nProvider), so a
// file that imports one of them at the top must never be reachable through
// the static import graph of a package export, or the app would fail at
// import time. Such a file is loaded with a dynamic import() from a method
// production never runs instead (see PsychicBin.syncOpenapiTypescriptFiles).
const devOnlyPackages = ['typescript', 'openapi-typescript']

const srcDir = path.resolve('src')
const packageExportsDir = path.join(srcDir, 'package-exports')
const packageExports = fs
  .readdirSync(packageExportsDir)
  .filter(entry => entry.endsWith('.ts'))
  .map(entry => path.join(packageExportsDir, entry))

interface StaticImportGraph {
  // every file reached, with the file that first reached it (null for the entry)
  reachedFrom: Map<string, string | null>
  // every package specifier reached, with the files that import it
  packages: Map<string, string[]>
}

function moduleSpecifierText(expression: ts.Expression | undefined): string | undefined {
  return expression && ts.isStringLiteral(expression) ? expression.text : undefined
}

// `import type … from`, or `import { type A, type B } from`, for which tsc
// emits no import (a value import whose bindings are only used as types is
// elided too, but counts here: write it as an import type)
function isTypeOnlyImport(statement: ts.ImportDeclaration): boolean {
  const clause = statement.importClause
  if (!clause) return false // a side-effect import
  if (clause.isTypeOnly) return true
  if (clause.name) return false
  const bindings = clause.namedBindings
  return !!bindings && ts.isNamedImports(bindings) && bindings.elements.every(element => element.isTypeOnly)
}

// `export type … from`, or `export { type A } from`
function isTypeOnlyExport(statement: ts.ExportDeclaration): boolean {
  if (statement.isTypeOnly) return true
  const clause = statement.exportClause
  return !!clause && ts.isNamedExports(clause) && clause.elements.every(element => element.isTypeOnly)
}

/**
 * The module specifiers a file's static imports name: `import … from`, a
 * side-effect `import '…'`, `export … from` and `import x = require('…')`,
 * found with TypeScript's parser. Type-only imports and exports are left out,
 * as is a dynamic `import()`, which loads its module only when it runs.
 */
function staticImportSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers: string[] = []

  for (const statement of sourceFile.statements) {
    let specifier: string | undefined

    if (ts.isImportDeclaration(statement)) {
      if (!isTypeOnlyImport(statement)) specifier = moduleSpecifierText(statement.moduleSpecifier)
      //
    } else if (ts.isExportDeclaration(statement)) {
      if (!isTypeOnlyExport(statement)) specifier = moduleSpecifierText(statement.moduleSpecifier)
      //
    } else if (ts.isImportEqualsDeclaration(statement)) {
      if (!statement.isTypeOnly && ts.isExternalModuleReference(statement.moduleReference))
        specifier = moduleSpecifierText(statement.moduleReference.expression)
    }

    if (specifier !== undefined) specifiers.push(specifier)
  }

  return specifiers
}

// a relative specifier names the file tsc emits (`./foo.js`); its source is
// the .ts file next to the importer
function resolveRelative(fromFile: string, specifier: string): string {
  const target = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [target.replace(/\.js$/, '.ts'), target.replace(/\.js$/, '.tsx'), target]
  const resolved = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
  if (resolved === undefined) throw new Error(`cannot resolve '${specifier}' imported by ${fromFile}`)
  return resolved
}

function staticImportGraph(entry: string): StaticImportGraph {
  const reachedFrom = new Map<string, string | null>([[entry, null]])
  const packages = new Map<string, string[]>()
  const queue = [entry]

  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    // a JSON module imports nothing
    if (!/\.tsx?$/.test(file)) continue

    const sourceFile = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)

    for (const specifier of staticImportSpecifiers(sourceFile)) {
      if (!specifier.startsWith('.')) {
        packages.set(specifier, [...(packages.get(specifier) ?? []), file])
        continue
      }

      const resolved = resolveRelative(file, specifier)
      if (reachedFrom.has(resolved)) continue
      reachedFrom.set(resolved, file)
      queue.push(resolved)
    }
  }

  return { reachedFrom, packages }
}

// the files from the entry to `file`, as the walk reached it
function importChain(graph: StaticImportGraph, file: string): string[] {
  const chain: string[] = []
  for (
    let current: string | null = file;
    current !== null;
    current = graph.reachedFrom.get(current) ?? null
  ) {
    chain.unshift(path.relative(process.cwd(), current))
  }
  return chain
}

// one line per static import of a devDependency the entry reaches, e.g.
// `src/package-exports/system.ts -> src/bin/index.ts -> src/bin/helpers/resolveAliases.ts -> typescript`
function devOnlyImportChains(entry: string): string[] {
  const graph = staticImportGraph(entry)
  const chains: string[] = []

  for (const [specifier, importers] of graph.packages) {
    if (!devOnlyPackages.some(name => specifier === name || specifier.startsWith(`${name}/`))) continue
    for (const importer of importers) chains.push([...importChain(graph, importer), specifier].join(' -> '))
  }

  return chains.sort()
}

describe('the package exports', () => {
  // the walk must see the graph it guards, or the assertions below would pass vacuously
  it('are walked through their static imports into the files they reach and the packages those import', () => {
    const graph = staticImportGraph(path.join(packageExportsDir, 'system.ts'))
    const reached = [...graph.reachedFrom.keys()].map(file => path.relative(srcDir, file))

    expect(reached).toEqual(expect.arrayContaining(['bin/index.ts', 'cli/index.ts', 'psychic-app/index.ts']))
    expect([...graph.packages.keys()]).toEqual(expect.arrayContaining(['@rvoh/dream/system', 'commander']))
  })

  it('reports a static import of a devDependency with the chain of imports that reaches it', () => {
    // resolveAliases imports typescript at the top of its file, which is why
    // PsychicBin.resolveAliases loads it with a dynamic import
    expect(devOnlyImportChains(path.join(srcDir, 'bin/helpers/resolveAliases.ts'))).toEqual([
      'src/bin/helpers/resolveAliases.ts -> typescript',
    ])
  })

  for (const packageExport of packageExports) {
    it(`${path.relative(srcDir, packageExport)} reaches no static import of typescript or openapi-typescript`, () => {
      expect(devOnlyImportChains(packageExport)).toEqual([])
    })
  }
})
