import * as fs from 'node:fs'
import * as path from 'node:path'
import ts from 'typescript'

export interface ResolveAliasesOptions {
  /**
   * The tsconfig the build compiled with, or a directory containing a
   * tsconfig.json, as with `tsc -p`. Relative to `cwd`. Defaults to the
   * nearest tsconfig.json at or above `cwd`, as tsc does.
   */
  project?: string | undefined
  /**
   * The directory `project` is relative to and the search for a default
   * tsconfig.json starts from. Defaults to `process.cwd()`.
   */
  cwd?: string | undefined
}

export interface ResolveAliasesResult {
  tsconfigPath: string
  filesChanged: number
  specifiersRewritten: number
}

interface SpecifierEdit {
  start: number
  end: number
  replacement: string
}

// emitted files whose imports are rewritten
const JS_OUTPUT_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx']
// each declaration extension, with the JavaScript extension an import of it is written with
const DECLARATION_OUTPUT_EXTENSIONS: [string, string][] = [
  ['.d.ts', '.js'],
  ['.d.mts', '.mjs'],
  ['.d.cts', '.cjs'],
]

/**
 * Rewrites the tsconfig `paths` aliases left in tsc's output (e.g.
 * `import '@conf/loadEnv.js'`) to relative paths that Node resolves
 * (`import './conf/loadEnv.js'`), in every `.js` and `.d.ts` file tsc emitted
 * for the tsconfig's program: its own source files, and the files they import
 * from outside its `include`. Static, side-effect, `export … from` (`export *
 * as ns from` included), dynamic and `require` imports are rewritten, and
 * import types and module augmentations in declaration files.
 *
 * Everything follows TypeScript's own rules: the tsconfig is read as tsc
 * reads it (honoring `extends`, so `paths` resolve against the config that
 * declares them), each import is found by parsing the emitted file with
 * TypeScript's parser, counting only what TypeScript counts as an import (so
 * text that only looks like one, in a string, a comment or the argument of a
 * method named require such as `rules.require(…)` or `module.require(…)`, is
 * never touched), resolved with TypeScript's module resolution (so the longest
 * matching alias wins, and an alias with several targets resolves to the
 * first target that exists), and mapped to the file tsc emitted for its
 * target (honoring `outDir`, `rootDir` and `declarationDir`), JSON modules
 * included. The rewritten path names that emitted file, extension included.
 *
 * Relative imports, packages, and imports that do not resolve to a file the
 * build emitted (e.g. a missing module) are left unchanged, so running it
 * again changes nothing. Source maps are not updated. A tsconfig that sets
 * `noEmit`, or whose output would overwrite its own source files, is
 * refused with an error before any file is written.
 */
export default function resolveAliases({
  project,
  cwd = process.cwd(),
}: ResolveAliasesOptions = {}): ResolveAliasesResult {
  const tsconfigPath = findTsconfig(project, cwd)
  const configCommandLine = parseTsconfig(tsconfigPath, cwd)

  if (configCommandLine.options.outFile) {
    throw new Error(
      `resolve-aliases: ${tsconfigPath} sets outFile; only builds that emit one file per source file can be rewritten`,
    )
  }

  // a noEmit config writes nothing, so whatever sits at its output paths is not
  // its output: a stale build, or, with allowJs and no outDir, the app's sources
  if (configCommandLine.options.noEmit) {
    throw new Error(
      `resolve-aliases: ${tsconfigPath} sets noEmit, so tsc emits no files from it; pass the tsconfig the build compiles with`,
    )
  }

  const ignoreCase = !ts.sys.useCaseSensitiveFileNames
  const canonical = (fileName: string) => (ignoreCase ? fileName.toLowerCase() : fileName)
  const { commandLine, inputFiles } = emittedCommandLine(configCommandLine)
  const sourceFiles = new Map(commandLine.fileNames.map(fileName => [canonical(fileName), fileName]))
  const resolutionCache = ts.createModuleResolutionCache(cwd, canonical, commandLine.options)
  const outputCommandLine = withCommonSourceDirectoryPinned(commandLine, ignoreCase)

  const outputsBySourceFile = new Map<string, readonly string[]>()
  const outputsOf = (sourceFile: string) => {
    let outputs = outputsBySourceFile.get(sourceFile)
    if (!outputs) {
      outputs = ts.getOutputFileNames(outputCommandLine, sourceFile, ignoreCase)
      outputsBySourceFile.set(sourceFile, outputs)
    }
    return outputs
  }

  // tsc refuses to write over an input file (TS5055), so a file at such an
  // output path is a source, never output; stop before rewriting anything
  const inputFileSet = new Set(inputFiles.map(canonical))
  for (const sourceFile of commandLine.fileNames) {
    const overwritten = outputsOf(sourceFile).find(outputFile => inputFileSet.has(canonical(outputFile)))
    if (overwritten !== undefined) {
      throw new Error(
        `resolve-aliases: ${tsconfigPath} would emit ${overwritten} over its own source file, which tsc refuses to do; pass the tsconfig the build compiles with`,
      )
    }
  }

  const existence = new Map<string, boolean>()
  const exists = (fileName: string) => {
    let fileExists = existence.get(fileName)
    if (fileExists === undefined) {
      fileExists = fs.existsSync(fileName)
      existence.set(fileName, fileExists)
    }
    return fileExists
  }

  let filesChanged = 0
  let specifiersRewritten = 0

  for (const sourceFile of commandLine.fileNames) {
    const resolutionMode = ts.getImpliedNodeFormatForFile(
      sourceFile,
      resolutionCache.getPackageJsonInfoCache(),
      ts.sys,
      commandLine.options,
    )

    for (const outputFile of outputsOf(sourceFile)) {
      const declaration = isDeclarationOutput(outputFile)
      if (!declaration && !isJsOutput(outputFile)) continue
      if (!exists(outputFile)) continue

      const text = fs.readFileSync(outputFile, 'utf8')
      const edits: SpecifierEdit[] = []

      for (const { specifier, start } of importSpecifiers(outputFile, text)) {
        if (!isBareSpecifier(specifier)) continue

        const { resolvedModule } = ts.resolveModuleName(
          specifier,
          sourceFile,
          commandLine.options,
          ts.sys,
          resolutionCache,
          undefined,
          resolutionMode,
        )
        if (!resolvedModule || resolvedModule.isExternalLibraryImport) continue

        const targetSourceFile = sourceFiles.get(canonical(resolvedModule.resolvedFileName))
        if (!targetSourceFile) continue

        const target = emittedTarget(outputsOf(targetSourceFile), declaration)
        if (!target || !exists(target.emittedFile)) continue

        edits.push({
          start,
          end: start + specifier.length,
          replacement: relativeSpecifier(outputFile, target.specifierPath),
        })
      }

      if (!edits.length) continue

      let rewritten = text
      for (const edit of edits.sort((a, b) => b.start - a.start)) {
        rewritten = rewritten.slice(0, edit.start) + edit.replacement + rewritten.slice(edit.end)
      }

      fs.writeFileSync(outputFile, rewritten)
      filesChanged++
      specifiersRewritten += edits.length
    }
  }

  return { tsconfigPath, filesChanged, specifiersRewritten }
}

// mirrors tsc's -p: a directory means the tsconfig.json in it; no project
// means the nearest tsconfig.json at or above the working directory
function findTsconfig(project: string | undefined, cwd: string): string {
  if (project === undefined) {
    const found = ts.findConfigFile(cwd, fileName => ts.sys.fileExists(fileName))
    if (!found) {
      throw new Error(
        `resolve-aliases: no tsconfig.json found in ${cwd} or any directory above it; pass the build's tsconfig with -p`,
      )
    }
    return path.resolve(cwd, found)
  }

  const projectPath = path.resolve(cwd, project)
  const tsconfigPath = ts.sys.directoryExists(projectPath)
    ? path.join(projectPath, 'tsconfig.json')
    : projectPath
  if (!ts.sys.fileExists(tsconfigPath)) {
    throw new Error(`resolve-aliases: the tsconfig ${tsconfigPath} does not exist`)
  }
  return tsconfigPath
}

function parseTsconfig(tsconfigPath: string, cwd: string): ts.ParsedCommandLine {
  const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: () => cwd,
    getNewLine: () => ts.sys.newLine,
  }

  const commandLine = ts.getParsedCommandLineOfConfigFile(tsconfigPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(`resolve-aliases: ${ts.formatDiagnostics([diagnostic], formatHost).trim()}`)
    },
  })

  if (!commandLine) throw new Error(`resolve-aliases: could not read ${tsconfigPath}`)
  if (commandLine.errors.length) {
    throw new Error(`resolve-aliases: ${ts.formatDiagnostics(commandLine.errors, formatHost).trim()}`)
  }
  return commandLine
}

// tsc emits every source file of the program its tsconfig builds, not only the
// files its `files`/`include` lists: a file outside `include` that the build
// imports (e.g. '../package.json'), and JSON modules, which a directory
// `include` never lists. With rootDir unset, those files also widen the common
// source directory that every output path is laid out under. So build that
// program (parsing only: nothing is type-checked) and take its source files
// that tsc emits, by tsc's rules, as the command line's files. inputFiles is
// every file of the program, emitted or not.
function emittedCommandLine(configCommandLine: ts.ParsedCommandLine): {
  commandLine: ts.ParsedCommandLine
  inputFiles: string[]
} {
  const { options, projectReferences } = configCommandLine
  const program = ts.createProgram({
    rootNames: configCommandLine.fileNames,
    options,
    ...(projectReferences ? { projectReferences } : {}),
  })

  const programFiles = program.getSourceFiles()
  const fileNames = programFiles
    .filter(
      sourceFile =>
        !sourceFile.isDeclarationFile &&
        !program.isSourceFileFromExternalLibrary(sourceFile) &&
        // tsc writes a JSON module only into an outDir
        (options.outDir !== undefined || !sourceFile.fileName.endsWith('.json')),
    )
    .map(sourceFile => sourceFile.fileName)

  return {
    commandLine: { ...configCommandLine, fileNames },
    inputFiles: programFiles.map(sourceFile => sourceFile.fileName),
  }
}

// With rootDir unset, each getOutputFileNames call recomputes the common
// directory of all the source files, which makes mapping a large build
// quadratic. Pin the directory TypeScript computes, read back from one file's
// output, as rootDir: every file then maps to the same output as before.
function withCommonSourceDirectoryPinned(
  commandLine: ts.ParsedCommandLine,
  ignoreCase: boolean,
): ts.ParsedCommandLine {
  const { options } = commandLine
  if (options.rootDir || options.composite) return commandLine

  for (const sourceFile of commandLine.fileNames) {
    // the first output is the JavaScript, or, under emitDeclarationOnly, the declaration
    const [outputFile] = ts.getOutputFileNames(commandLine, sourceFile, ignoreCase)
    if (outputFile === undefined) continue

    const outputDir = isDeclarationOutput(outputFile)
      ? (options.declarationDir ?? options.outDir)
      : options.outDir
    // with no outDir, output sits beside its source and the common directory
    // plays no part; anything unexpected keeps TypeScript's own computation
    if (outputDir === undefined || !outputFile.startsWith(`${outputDir}/`)) return commandLine

    // the output's directory below outputDir (e.g. '/models', or '') is the
    // source's directory below the common directory
    const subdirectory = outputFile.slice(outputDir.length, outputFile.lastIndexOf('/'))
    const sourceDirectory = sourceFile.slice(0, sourceFile.lastIndexOf('/'))
    if (!sourceDirectory.endsWith(subdirectory)) return commandLine

    const rootDir = sourceDirectory.slice(0, sourceDirectory.length - subdirectory.length)
    return { ...commandLine, options: { ...options, rootDir } }
  }

  return commandLine
}

// relative and absolute paths already resolve in Node, and `#` specifiers are
// package.json imports, which Node resolves itself
function isBareSpecifier(specifier: string) {
  return !specifier.startsWith('.') && !specifier.startsWith('#') && !path.isAbsolute(specifier)
}

// The module specifiers of an emitted file, found by parsing it, where
// TypeScript counts an import: import and export declarations (`export * as
// ns from` included), `import x = require(…)`, dynamic `import(…)`, a call of
// `require` itself with one string (as TypeScript's own require-call rule: a
// method named require, such as `rules.require(…)` or `module.require(…)`, is
// not an import), import types, and module augmentations. Each specifier comes
// with the offset of its text inside the quotes; a literal written with
// escapes is skipped, since its source text is not the specifier.
function importSpecifiers(fileName: string, text: string): { specifier: string; start: number }[] {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest)
  const specifiers: { specifier: string; start: number }[] = []

  const record = (literal: ts.Node | undefined) => {
    if (literal === undefined || !ts.isStringLiteralLike(literal)) return
    const start = literal.getStart(sourceFile) + 1
    if (text.slice(start, literal.end - 1) !== literal.text) return
    specifiers.push({ specifier: literal.text, start })
  }

  // Every node, in source order, walked with a stack rather than recursion: tsc
  // compiles expressions nested thousands deep (e.g. a long `+` chain), and a
  // recursive walk overflows the call stack on them. Children go on the stack
  // last first, so the first comes off next.
  const pending: ts.Node[] = [sourceFile]
  for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      record(node.moduleSpecifier)
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      record(node.moduleReference.expression)
    } else if (ts.isCallExpression(node) && isImportOrRequireCall(node)) {
      record(node.arguments[0])
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      record(node.argument.literal)
    }

    const children: ts.Node[] = []
    // a block body, since forEachChild stops at the first truthy return
    ts.forEachChild(node, child => {
      children.push(child)
    })
    for (const child of children.reverse()) pending.push(child)
  }

  // in a module, `declare module '…'` at the top level augments that module
  if (ts.isExternalModule(sourceFile)) {
    for (const statement of sourceFile.statements) {
      if (ts.isModuleDeclaration(statement)) record(statement.name)
    }
  }

  return specifiers
}

function isImportOrRequireCall(call: ts.CallExpression) {
  if (call.expression.kind === ts.SyntaxKind.ImportKeyword) return true
  return ts.isIdentifier(call.expression) && call.expression.text === 'require' && call.arguments.length === 1
}

function isJsOutput(fileName: string) {
  return JS_OUTPUT_EXTENSIONS.some(extension => fileName.endsWith(extension))
}

function isDeclarationOutput(fileName: string) {
  return declarationImportPath(fileName) !== undefined
}

// the path an import of a declaration file is written with, e.g. User.d.ts → User.js
function declarationImportPath(fileName: string): string | undefined {
  for (const [declarationExtension, jsExtension] of DECLARATION_OUTPUT_EXTENSIONS) {
    if (fileName.endsWith(declarationExtension)) {
      return fileName.slice(0, -declarationExtension.length) + jsExtension
    }
  }
  return undefined
}

// a JavaScript file imports its target's emitted JavaScript; a declaration
// file imports its target's emitted declaration, written with the JavaScript
// extension as tsc writes it (so it also holds under a separate declarationDir)
function emittedTarget(
  targetOutputs: readonly string[],
  fromDeclaration: boolean,
): { emittedFile: string; specifierPath: string } | undefined {
  if (fromDeclaration) {
    for (const outputFile of targetOutputs) {
      const importPath = declarationImportPath(outputFile)
      if (importPath) return { emittedFile: outputFile, specifierPath: importPath }
    }
  }

  const jsFile = targetOutputs.find(outputFile => isJsOutput(outputFile) || outputFile.endsWith('.json'))
  return jsFile ? { emittedFile: jsFile, specifierPath: jsFile } : undefined
}

function relativeSpecifier(fromFile: string, toFile: string) {
  const relativePath = path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/')
  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}
