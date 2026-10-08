import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import ts from 'typescript'
import type { MockInstance } from 'vitest'
import PsychicBin from '../../../src/bin/index.js'
import resolveAliases from '../../../src/bin/helpers/resolveAliases.js'

// Each fixture is a small app written at runtime under the gitignored spec/tmp
// and compiled with TypeScript's own emit, exactly as `tsc -p` would, so the
// rewrite runs against real tsc output.
const tmpRoot = path.resolve('spec/tmp/resolveAliases')

function writeTree(root: string, files: Record<string, string>) {
  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = path.join(root, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, contents)
  }
}

function compile(tsconfigPath: string) {
  const parsed = ts.getParsedCommandLineOfConfigFile(tsconfigPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    },
  })
  if (!parsed) throw new Error(`expected to parse ${tsconfigPath}`)
  const result = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options }).emit()
  if (result.emitSkipped) throw new Error(`expected tsc to emit ${tsconfigPath}`)
}

function read(root: string, relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function readAll(dir: string): Record<string, string> {
  const contents: Record<string, string> = {}
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue
    const filePath = path.join(entry.parentPath, entry.name)
    contents[path.relative(dir, filePath)] = fs.readFileSync(filePath, 'utf8')
  }
  return contents
}

function runNode(entry: string) {
  return execFileSync(process.execPath, [entry], { encoding: 'utf8', stdio: 'pipe' })
}

const esmApp = path.join(tmpRoot, 'esm')

// paths live in a base config one directory down, so they resolve against that
// config's directory (TypeScript's paths base), not the build config's;
// `@lib/*` has two targets, and `@app/models/*` is a longer prefix than `@app/*`
// pointing somewhere else (src/app/models/User.ts is a decoy only `@app/*`
// would reach)
const esmFiles: Record<string, string> = {
  'package.json': JSON.stringify({ type: 'module' }),
  'configs/tsconfig.paths.json': JSON.stringify({
    compilerOptions: {
      paths: {
        '@conf/*': ['../src/conf/*'],
        '@app/*': ['../src/app/*'],
        '@app/models/*': ['../src/models/*'],
        '@lib/*': ['../src/lib-a/*', '../src/lib-b/*'],
      },
    },
  }),
  'tsconfig.build.json': JSON.stringify({
    extends: './configs/tsconfig.paths.json',
    compilerOptions: {
      module: 'nodenext',
      moduleResolution: 'nodenext',
      target: 'es2022',
      outDir: './dist',
      rootDir: './',
      declaration: true,
      types: [],
      skipLibCheck: true,
    },
    include: ['src'],
  }),
  'src/models/User.ts': `export default class User {
  name = 'u'
}
`,
  'src/app/models/User.ts': `export default class DecoyUser {}
`,
  'src/app/greeting.ts': `import User from '@app/models/User.js'

export function greet(user: User) {
  return 'hi ' + user.name
}

export const makeUser = () => new User()
`,
  'src/conf/loadEnv.ts': `console.log('loadEnv evaluated')
export const env = 'test'
`,
  'src/conf/system/helper.ts': `import { makeUser } from '@app/greeting.js'

export function helper() {
  return makeUser()
}
`,
  'src/lib-a/fromA.ts': `export const fromA = 'a'
`,
  'src/lib-b/fromB.ts': `export const fromB = 'b'
`,
  'src/main.ts': `import '@conf/loadEnv.js'
import colors from 'yoctocolors'
import { fromA } from '@lib/fromA.js'
import { fromB } from '@lib/fromB.js'
import { helper } from '@conf/system/helper.js'
import { greet } from './app/greeting.js'
export { helper as reexportedHelper } from '@conf/system/helper.js'
export * from '@app/greeting.js'

// import '@conf/inComment.js'
export const notAnImport = "import y from '@app/models/User.js'"

export const loadUser = async () => (await import('@app/models/User.js')).default
export const loadMissing = () => import('@conf/missing.js')

const User = await loadUser()
const user = helper()
console.log([fromA, fromB, greet(user), user instanceof User, typeof colors.red].join(' '))
`,
}

describe('PsychicBin.resolveAliases', () => {
  let consoleLogSpy: MockInstance

  beforeEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  })

  context('an ESM app whose tsconfig paths come from an extended config', () => {
    beforeEach(() => {
      writeTree(esmApp, esmFiles)
      compile(path.join(esmApp, 'tsconfig.build.json'))
    })

    it('rewrites static, side-effect, export-from and dynamic imports in the emitted JavaScript to relative paths', () => {
      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(read(esmApp, 'dist/src/main.js')).toEqual(`import './conf/loadEnv.js';
import colors from 'yoctocolors';
import { fromA } from './lib-a/fromA.js';
import { fromB } from './lib-b/fromB.js';
import { helper } from './conf/system/helper.js';
import { greet } from './app/greeting.js';
export { helper as reexportedHelper } from './conf/system/helper.js';
export * from './app/greeting.js';
// import '@conf/inComment.js'
export const notAnImport = "import y from '@app/models/User.js'";
export const loadUser = async () => (await import('./models/User.js')).default;
export const loadMissing = () => import('@conf/missing.js');
const User = await loadUser();
const user = helper();
console.log([fromA, fromB, greet(user), user instanceof User, typeof colors.red].join(' '));
`)
    })

    it('rewrites relative to the directory of each emitted file', () => {
      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(read(esmApp, 'dist/src/conf/system/helper.js')).toContain(
        "import { makeUser } from '../../app/greeting.js';",
      )
      expect(read(esmApp, 'dist/src/app/greeting.js')).toContain("import User from '../models/User.js';")
    })

    it('rewrites the emitted declaration files, including import types', () => {
      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      const declarations = read(esmApp, 'dist/src/main.d.ts')
      expect(declarations).toContain("import './conf/loadEnv.js';")
      expect(declarations).toContain("export { helper as reexportedHelper } from './conf/system/helper.js';")
      expect(declarations).toContain("export * from './app/greeting.js';")
      expect(declarations).toContain('typeof import("./models/User.js")')
      expect(declarations).toContain(
        `export declare const notAnImport = "import y from '@app/models/User.js'";`,
      )
      expect(read(esmApp, 'dist/src/app/greeting.d.ts')).toContain("import User from '../models/User.js';")
    })

    it('leaves an alias that resolves to no file unchanged', () => {
      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(read(esmApp, 'dist/src/main.js')).toContain("import('@conf/missing.js')")
    })

    it('prints a one-line summary and returns the counts', () => {
      const result = PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      // main.js 7, helper.js 1, greeting.js 1; main.d.ts 4, greeting.d.ts 1 (tsc
      // writes helper.d.ts's import type relative already)
      expect(result).toEqual({
        tsconfigPath: path.join(esmApp, 'tsconfig.build.json'),
        filesChanged: 5,
        specifiersRewritten: 14,
      })
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith('resolve-aliases: rewrote 14 aliased imports in 5 files')
    })

    it('changes nothing when run a second time', () => {
      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })
      const afterFirstRun = readAll(path.join(esmApp, 'dist'))

      const result = PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(result).toEqual(expect.objectContaining({ filesChanged: 0, specifiersRewritten: 0 }))
      expect(readAll(path.join(esmApp, 'dist'))).toEqual(afterFirstRun)
    })

    it('rewrites export * as namespace re-exports in the JavaScript and the declarations', () => {
      writeTree(esmApp, {
        'src/app/namespaced.ts': `export * as UserModule from '@app/models/User.js'
export type * as UserTypes from '@app/models/User.js'
`,
      })
      compile(path.join(esmApp, 'tsconfig.build.json'))

      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(read(esmApp, 'dist/src/app/namespaced.js'))
        .toEqual(`export * as UserModule from '../models/User.js';
`)
      const declarations = read(esmApp, 'dist/src/app/namespaced.d.ts')
      expect(declarations).toContain("export * as UserModule from '../models/User.js';")
      expect(declarations).toContain("export type * as UserTypes from '../models/User.js';")
      expect(runNode(path.join(esmApp, 'dist/src/app/namespaced.js'))).toEqual('')
    })

    it('rewrites module augmentations in the declarations', () => {
      writeTree(esmApp, {
        'src/app/augmentation.ts': `import User from '@app/models/User.js'

declare module '@app/models/User.js' {
  interface Augmented {
    extra: string
  }
}

export const augmentedUser = new User()
`,
      })
      compile(path.join(esmApp, 'tsconfig.build.json'))

      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(read(esmApp, 'dist/src/app/augmentation.d.ts')).toContain("declare module '../models/User.js' {")
    })

    it('finds an import that follows a regular expression containing a quote', () => {
      writeTree(esmApp, {
        'src/app/afterRegex.ts': `export const loaders = [/'/.test("'"), () => import('@app/greeting.js')]
`,
      })
      compile(path.join(esmApp, 'tsconfig.build.json'))

      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(read(esmApp, 'dist/src/app/afterRegex.js')).toEqual(
        `export const loaders = [/'/.test("'"), () => import('./greeting.js')];
`,
      )
    })

    it('leaves the arguments of methods named require unchanged, so runtime data is not rewritten', () => {
      const rulesSource = `const rules = { require: (key: string) => key }

console.log([rules.require('@app/greeting.js'), rules?.require('@app/greeting.js')].join(' '))
`
      writeTree(esmApp, { 'src/app/rules.ts': rulesSource })
      compile(path.join(esmApp, 'tsconfig.build.json'))
      const emitted = read(esmApp, 'dist/src/app/rules.js')

      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(read(esmApp, 'dist/src/app/rules.js')).toEqual(emitted)
      expect(runNode(path.join(esmApp, 'dist/src/app/rules.js'))).toEqual(
        '@app/greeting.js @app/greeting.js\n',
      )
    })

    it('makes the emitted app runnable with node', () => {
      expect(() => runNode(path.join(esmApp, 'dist/src/main.js'))).toThrow(
        "Cannot find package '@conf/loadEnv.js'",
      )

      PsychicBin.resolveAliases({ project: path.join(esmApp, 'tsconfig.build.json') })

      expect(runNode(path.join(esmApp, 'dist/src/main.js'))).toEqual(
        'loadEnv evaluated\na b hi u true function\n',
      )
    })
  })

  context('a CommonJS app importing aliases without extensions', () => {
    const cjsApp = path.join(tmpRoot, 'cjs')

    beforeEach(() => {
      writeTree(cjsApp, {
        'package.json': JSON.stringify({ type: 'commonjs' }),
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            module: 'node16',
            moduleResolution: 'node16',
            target: 'es2022',
            outDir: './dist',
            rootDir: './src',
            types: [],
            skipLibCheck: true,
            paths: { '@conf/*': ['./src/conf/*'] },
          },
          include: ['src'],
        }),
        'src/conf/settings.ts': `export const setting = 'cjs ok'
`,
        'src/conf/index.ts': `export const fromIndex = 'index ok'
`,
        'src/main.ts': `import { setting } from '@conf/settings'
import { fromIndex } from '@conf/index'

console.log(setting + ' ' + fromIndex)
`,
      })
      compile(path.join(cjsApp, 'tsconfig.json'))
    })

    it('rewrites require calls to the emitted files, and the app runs with node', () => {
      PsychicBin.resolveAliases({ project: path.join(cjsApp, 'tsconfig.json') })

      const main = read(cjsApp, 'dist/main.js')
      expect(main).toContain('require("./conf/settings.js")')
      expect(main).toContain('require("./conf/index.js")')
      expect(runNode(path.join(cjsApp, 'dist/main.js'))).toEqual('cjs ok index ok\n')
    })
  })
})

describe('resolveAliases', () => {
  const defaultsApp = path.join(tmpRoot, 'defaults')

  beforeEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    writeTree(defaultsApp, {
      'package.json': JSON.stringify({ type: 'module' }),
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'nodenext',
          moduleResolution: 'nodenext',
          target: 'es2022',
          // no rootDir: tsc writes src/main.ts to dist/main.js, the common
          // directory of the sources
          outDir: './dist',
          types: [],
          skipLibCheck: true,
          paths: { '@conf/*': ['./src/conf/*'] },
        },
        include: ['src'],
      }),
      'src/conf/settings.ts': `export const setting = 'ok'
`,
      'src/main.ts': `export { setting } from '@conf/settings.js'
`,
    })
    compile(path.join(defaultsApp, 'tsconfig.json'))
  })

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  })

  context('with no project', () => {
    it('uses the nearest tsconfig.json at or above the working directory, as tsc does', () => {
      const result = resolveAliases({ cwd: path.join(defaultsApp, 'src/conf') })

      expect(result.tsconfigPath).toEqual(path.join(defaultsApp, 'tsconfig.json'))
      expect(read(defaultsApp, 'dist/main.js')).toEqual(`export { setting } from './conf/settings.js';
`)
    })
  })

  context('with a directory as the project', () => {
    it('uses the tsconfig.json in that directory, as tsc does', () => {
      const result = resolveAliases({ project: 'defaults', cwd: tmpRoot })

      expect(result.tsconfigPath).toEqual(path.join(defaultsApp, 'tsconfig.json'))
      expect(read(defaultsApp, 'dist/main.js')).toEqual(`export { setting } from './conf/settings.js';
`)
    })
  })

  context('with a project that does not exist', () => {
    it('throws, naming the path, and rewrites nothing', () => {
      expect(() => resolveAliases({ project: 'defaults/tsconfig.missing.json', cwd: tmpRoot })).toThrow(
        `resolve-aliases: the tsconfig ${path.join(defaultsApp, 'tsconfig.missing.json')} does not exist`,
      )
      expect(read(defaultsApp, 'dist/main.js')).toEqual(`export { setting } from '@conf/settings.js';
`)
    })
  })

  // tsc emits every source file of its program, not only the files the
  // tsconfig's files/include lists: JSON modules (which a directory include
  // never lists) and any file the build imports from outside include
  context('an alias to a JSON module', () => {
    const jsonApp = path.join(tmpRoot, 'json')

    beforeEach(() => {
      writeTree(jsonApp, {
        'package.json': JSON.stringify({ type: 'module' }),
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            module: 'nodenext',
            moduleResolution: 'nodenext',
            target: 'es2022',
            outDir: './dist',
            rootDir: './',
            resolveJsonModule: true,
            types: [],
            skipLibCheck: true,
            paths: { '@conf/*': ['./src/conf/*'] },
          },
          include: ['src'],
        }),
        'src/conf/settings.json': JSON.stringify({ name: 'json ok' }),
        'src/conf/other.ts': `export const other = 'other ok'
`,
        'src/main.ts': `import settings from '@conf/settings.json' with { type: 'json' }
import { other } from '@conf/other.js'

console.log(settings.name + ' ' + other)
`,
      })
      compile(path.join(jsonApp, 'tsconfig.json'))
    })

    it('rewrites it to the JSON file tsc emitted, and the app runs with node', () => {
      const result = resolveAliases({ project: path.join(jsonApp, 'tsconfig.json') })

      expect(read(jsonApp, 'dist/src/main.js'))
        .toEqual(`import settings from './conf/settings.json' with { type: 'json' };
import { other } from './conf/other.js';
console.log(settings.name + ' ' + other);
`)
      expect(result).toEqual(expect.objectContaining({ filesChanged: 1, specifiersRewritten: 2 }))
      expect(runNode(path.join(jsonApp, 'dist/src/main.js'))).toEqual('json ok other ok\n')
    })
  })

  context('an alias to a file outside include that the build imports', () => {
    const outsideApp = path.join(tmpRoot, 'outside-include')

    beforeEach(() => {
      writeTree(outsideApp, {
        'package.json': JSON.stringify({ type: 'module' }),
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            module: 'node16',
            moduleResolution: 'node16',
            target: 'es2022',
            outDir: './dist',
            rootDir: './',
            types: [],
            skipLibCheck: true,
            paths: { '@conf/*': ['./src/conf/*'], '@spec/*': ['./spec/*'] },
          },
          include: ['src'],
        }),
        'src/conf/settings.ts': `export const setting = 'helped'
`,
        'spec/helper.ts': `import { setting } from '@conf/settings.js'

export const helper = () => setting
`,
        'src/main.ts': `import { helper } from '@spec/helper.js'

console.log(helper())
`,
      })
      compile(path.join(outsideApp, 'tsconfig.json'))
    })

    it('rewrites it to the file tsc emitted, rewrites that file’s own aliases, and the app runs with node', () => {
      resolveAliases({ project: path.join(outsideApp, 'tsconfig.json') })

      expect(read(outsideApp, 'dist/src/main.js')).toContain("import { helper } from '../spec/helper.js';")
      expect(read(outsideApp, 'dist/spec/helper.js')).toContain(
        "import { setting } from '../src/conf/settings.js';",
      )
      expect(runNode(path.join(outsideApp, 'dist/src/main.js'))).toEqual('helped\n')
    })
  })

  context('with rootDir unset and an import of a file outside include', () => {
    const packageJsonApp = path.join(tmpRoot, 'package-json')

    beforeEach(() => {
      writeTree(packageJsonApp, {
        'package.json': JSON.stringify({ type: 'module', version: '1.2.3' }),
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            module: 'nodenext',
            moduleResolution: 'nodenext',
            target: 'es2022',
            // tsc's common source directory takes in ../package.json, so it
            // writes src/main.ts to dist/src/main.js, not dist/main.js
            outDir: './dist',
            resolveJsonModule: true,
            types: [],
            skipLibCheck: true,
            paths: { '@conf/*': ['./src/conf/*'] },
          },
          include: ['src'],
        }),
        'src/conf/settings.ts': `export const setting = 'ok'
`,
        'src/main.ts': `import pkg from '../package.json' with { type: 'json' }
import { setting } from '@conf/settings.js'

console.log(setting + ' ' + pkg.version)
`,
      })
      compile(path.join(packageJsonApp, 'tsconfig.json'))
    })

    it('rewrites the aliases where tsc emitted them, and the app runs with node', () => {
      const result = resolveAliases({ project: path.join(packageJsonApp, 'tsconfig.json') })

      expect(read(packageJsonApp, 'dist/src/main.js'))
        .toEqual(`import pkg from '../package.json' with { type: 'json' };
import { setting } from './conf/settings.js';
console.log(setting + ' ' + pkg.version);
`)
      expect(result).toEqual(expect.objectContaining({ filesChanged: 1, specifiersRewritten: 1 }))
      expect(runNode(path.join(packageJsonApp, 'dist/src/main.js'))).toEqual('ok 1.2.3\n')
    })
  })

  // a `+` chain of thousands of terms parses to an expression nested that many
  // levels deep, which tsc compiles; the dynamic import is its innermost operand.
  // A recursive walk overflows the call stack well below 5000 terms, and
  // TypeScript's own emit of the chain slows quadratically above 10000
  context('an emitted file holding a deeply nested expression', () => {
    const deepApp = path.join(tmpRoot, 'deep')

    it.each([5000, 10000])(
      'rewrites the aliases in and around a %i-term chain, and the app runs with node',
      terms => {
        writeTree(deepApp, {
          'package.json': JSON.stringify({ type: 'module' }),
          'tsconfig.json': JSON.stringify({
            compilerOptions: {
              module: 'nodenext',
              moduleResolution: 'nodenext',
              target: 'es2022',
              outDir: './dist',
              rootDir: './',
              declaration: true,
              types: [],
              skipLibCheck: true,
              paths: { '@app/*': ['./src/*'] },
            },
            include: ['src'],
          }),
          'src/conf/settings.ts': `export const setting = 'deep ok'
`,
          'src/deep.ts': `export const loadValue = async (): Promise<string> =>
  (await import('@app/conf/settings.js')).setting${" + ''".repeat(terms - 1)}
`,
          'src/main.ts': `import { loadValue } from '@app/deep.js'

console.log(await loadValue())
`,
        })
        compile(path.join(deepApp, 'tsconfig.json'))
        const emittedDeep = read(deepApp, 'dist/src/deep.js')
        expect(emittedDeep).toContain("import('@app/conf/settings.js')")

        const result = resolveAliases({ project: path.join(deepApp, 'tsconfig.json') })

        expect(read(deepApp, 'dist/src/deep.js')).toEqual(
          emittedDeep.replace("import('@app/conf/settings.js')", "import('./conf/settings.js')"),
        )
        expect(read(deepApp, 'dist/src/main.js')).toEqual(`import { loadValue } from './deep.js';
console.log(await loadValue());
`)
        expect(result).toEqual(expect.objectContaining({ filesChanged: 2, specifiersRewritten: 2 }))
        expect(runNode(path.join(deepApp, 'dist/src/main.js'))).toEqual('deep ok\n')
      },
    )
  })

  // tsc writes nothing for these configs, so the only files at their output
  // paths are the app's own JavaScript sources, which must never be rewritten
  context('a JavaScript app whose tsconfig emits no files', () => {
    const jsApp = path.join(tmpRoot, 'js')
    const mainSource = `const target = require('@app/target.js')
console.log(target)
`
    const jsFiles = (compilerOptions: Record<string, unknown>) => ({
      'package.json': JSON.stringify({ type: 'commonjs' }),
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'node16',
          moduleResolution: 'node16',
          target: 'es2022',
          allowJs: true,
          types: [],
          skipLibCheck: true,
          paths: { '@app/*': ['./src/*'] },
          ...compilerOptions,
        },
        include: ['src'],
      }),
      'src/target.js': `module.exports = 42
`,
      'src/main.js': mainSource,
    })

    context('because it sets noEmit', () => {
      beforeEach(() => {
        writeTree(jsApp, jsFiles({ noEmit: true }))
      })

      it('throws, asking for the tsconfig the build compiles with, and leaves the sources unchanged', () => {
        const message = `resolve-aliases: ${path.join(jsApp, 'tsconfig.json')} sets noEmit, so tsc emits no files from it; pass the tsconfig the build compiles with`

        expect(() => resolveAliases({ project: path.join(jsApp, 'tsconfig.json') })).toThrow(message)
        expect(() => resolveAliases({ cwd: jsApp })).toThrow(message)
        expect(read(jsApp, 'src/main.js')).toEqual(mainSource)
      })
    })

    context('because its output would overwrite its sources (no outDir)', () => {
      beforeEach(() => {
        writeTree(jsApp, jsFiles({}))
      })

      it('throws, naming the source file, and leaves the sources unchanged', () => {
        // TypeScript's program lists an imported file before its importer
        expect(() => resolveAliases({ project: path.join(jsApp, 'tsconfig.json') })).toThrow(
          `resolve-aliases: ${path.join(jsApp, 'tsconfig.json')} would emit ${path.join(jsApp, 'src/target.js')} over its own source file, which tsc refuses to do; pass the tsconfig the build compiles with`,
        )
        expect(read(jsApp, 'src/main.js')).toEqual(mainSource)
      })
    })
  })
})
