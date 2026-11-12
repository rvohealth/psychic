import { DreamApp } from '@rvoh/dream'
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as cliPromptModule from '../../../../src/cli/helpers/cli-prompt.js'
import generateController, { ControllerFilesAlreadyExist } from '../../../../src/generate/controller.js'
import * as psychicPathModule from '../../../../src/helpers/path/psychicPath.js'
import PsychicApp from '../../../../src/psychic-app/index.js'

describe('generateController', () => {
  let psychicApp: PsychicApp
  let tmpControllersFileRelativePath: string
  let tmpControllersFilepath: string
  let adminTmpControllersFilepath: string
  let internalTmpControllersFilepath: string
  let supportDir: string
  let adminSupportDir: string
  let internalSupportDir: string

  // empties the tmp controllers dir, keeping its tracked .keep
  async function clearTmpControllers() {
    for (const entry of await fs.readdir(tmpControllersFilepath)) {
      if (entry !== '.keep')
        await fs.rm(path.join(tmpControllersFilepath, entry), { recursive: true, force: true })
    }
  }

  beforeEach(async () => {
    psychicApp = PsychicApp.getOrFail()
    tmpControllersFileRelativePath = path.join('spec', 'tmp', 'controllers')
    tmpControllersFilepath = path.join(psychicApp.apiRoot, tmpControllersFileRelativePath)
    // the generator refuses to replace a controller or spec left with other content by an earlier example
    await clearTmpControllers()
    adminTmpControllersFilepath = path.join(tmpControllersFilepath, 'Admin')
    internalTmpControllersFilepath = path.join(tmpControllersFilepath, 'Internal')
    supportDir = path.join(psychicApp.apiRoot, 'spec', 'support', 'generators', 'controllers')
    adminSupportDir = path.join(supportDir, 'Admin')
    internalSupportDir = path.join(supportDir, 'Internal')
    vi.spyOn(psychicPathModule, 'default').mockReturnValue(tmpControllersFileRelativePath)
  })

  it('the controller extends AuthedController', async () => {
    const controllerFilename = 'PostsController.ts'
    const expected = await fs.readFile(path.join(supportDir, controllerFilename))
    const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
    if (existsSync(controllerPath)) await fs.rm(controllerPath)

    await generateController({
      fullyQualifiedControllerName: 'Posts',
      actions: [],
      singular: false,
    })
    const actual = await fs.readFile(controllerPath)
    expect(actual.toString()).toEqual(expected.toString())
  })

  context('namespaced controller', () => {
    it('the controller extends a base controller which extends AuthedController', async () => {
      const controllerFilename = 'PostsController.ts'
      const expectedBase = await fs.readFile(path.join(supportDir, 'Api', 'BaseController.ts'))
      const expected = await fs.readFile(path.join(supportDir, 'Api', controllerFilename))
      const basePath = path.join(tmpControllersFilepath, 'Api', 'BaseController.ts')
      if (existsSync(basePath)) await fs.rm(basePath)
      const controllerPath = path.join(tmpControllersFilepath, 'Api', controllerFilename)
      if (existsSync(controllerPath)) await fs.rm(controllerPath)

      await generateController({
        fullyQualifiedControllerName: 'Api/Posts',
        actions: [],
        singular: false,
      })
      const actualBase = await fs.readFile(basePath)
      const actual = await fs.readFile(controllerPath)
      expect(actualBase.toString()).toEqual(expectedBase.toString())
      expect(actual.toString()).toEqual(expected.toString())
    })
  })

  context('nested namespaced controller', () => {
    it('the controller extends a base controller which extends AuthedController', async () => {
      const controllerFilename = 'PostsController.ts'
      const expectedBase = await fs.readFile(path.join(supportDir, 'Api', 'BaseController.ts'))
      const expectedNestedBase = await fs.readFile(path.join(supportDir, 'Api', 'V1', 'BaseController.ts'))
      const expected = await fs.readFile(path.join(supportDir, 'Api', 'V1', controllerFilename))

      const basePath = path.join(tmpControllersFilepath, 'Api', 'BaseController.ts')
      if (existsSync(basePath)) await fs.rm(basePath)
      const nestedBasePath = path.join(tmpControllersFilepath, 'Api', 'V1', 'BaseController.ts')
      if (existsSync(nestedBasePath)) await fs.rm(nestedBasePath)

      const controllerPath = path.join(tmpControllersFilepath, 'Api', 'V1', controllerFilename)
      if (existsSync(controllerPath)) await fs.rm(controllerPath)

      await generateController({
        fullyQualifiedControllerName: 'Api/V1/Posts',
        actions: [],
        singular: false,
      })
      const actualBase = await fs.readFile(basePath)
      const actualNestedBase = await fs.readFile(nestedBasePath)
      const actual = await fs.readFile(controllerPath)
      expect(actualBase.toString()).toEqual(expectedBase.toString())
      expect(actualNestedBase.toString()).toEqual(expectedNestedBase.toString())
      expect(actual.toString()).toEqual(expected.toString())
    })
  })

  context('Admin', () => {
    it('the controller extends AdminAuthedController', async () => {
      const controllerFilename = 'PostsController.ts'
      const expected = await fs.readFile(path.join(adminSupportDir, controllerFilename))
      const controllerPath = path.join(adminTmpControllersFilepath, controllerFilename)
      if (existsSync(controllerPath)) await fs.rm(controllerPath)

      await generateController({
        fullyQualifiedControllerName: 'Admin/Posts',
        actions: [],
        singular: false,
      })
      const actual = await fs.readFile(controllerPath)
      expect(actual.toString()).toEqual(expected.toString())
    })

    context('namespaced controller', () => {
      it('the controller extends a base controller which extends AuthedController', async () => {
        const controllerFilename = 'PostsController.ts'
        const expectedBase = await fs.readFile(path.join(adminSupportDir, 'Api', 'BaseController.ts'))
        const expected = await fs.readFile(path.join(adminSupportDir, 'Api', controllerFilename))
        const basePath = path.join(adminTmpControllersFilepath, 'Api', 'BaseController.ts')
        if (existsSync(basePath)) await fs.rm(basePath)
        const controllerPath = path.join(adminTmpControllersFilepath, 'Api', controllerFilename)
        if (existsSync(controllerPath)) await fs.rm(controllerPath)

        await generateController({
          fullyQualifiedControllerName: 'Admin/Api/Posts',
          actions: [],
          singular: false,
        })
        const actualBase = await fs.readFile(basePath)
        const actual = await fs.readFile(controllerPath)
        expect(actualBase.toString()).toEqual(expectedBase.toString())
        expect(actual.toString()).toEqual(expected.toString())
      })
    })

    context('nested namespaced controller', () => {
      it('the controller extends a base controller which extends AuthedController', async () => {
        const controllerFilename = 'PostsController.ts'
        const expectedBase = await fs.readFile(path.join(adminSupportDir, 'Api', 'BaseController.ts'))
        const expectedNestedBase = await fs.readFile(
          path.join(adminSupportDir, 'Api', 'V1', 'BaseController.ts'),
        )
        const expected = await fs.readFile(path.join(adminSupportDir, 'Api', 'V1', controllerFilename))

        const basePath = path.join(adminTmpControllersFilepath, 'Api', 'BaseController.ts')
        if (existsSync(basePath)) await fs.rm(basePath)
        const nestedBasePath = path.join(adminTmpControllersFilepath, 'Api', 'V1', 'BaseController.ts')
        if (existsSync(nestedBasePath)) await fs.rm(nestedBasePath)

        const controllerPath = path.join(adminTmpControllersFilepath, 'Api', 'V1', controllerFilename)
        if (existsSync(controllerPath)) await fs.rm(controllerPath)

        await generateController({
          fullyQualifiedControllerName: 'Admin/Api/V1/Posts',
          actions: [],
          singular: false,
        })
        const actualBase = await fs.readFile(basePath)
        const actualNestedBase = await fs.readFile(nestedBasePath)
        const actual = await fs.readFile(controllerPath)
        expect(actualBase.toString()).toEqual(expectedBase.toString())
        expect(actualNestedBase.toString()).toEqual(expectedNestedBase.toString())
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })

  context('Internal', () => {
    it('the controller extends InternalAuthedController', async () => {
      const controllerFilename = 'PostsController.ts'
      const expected = await fs.readFile(path.join(internalSupportDir, controllerFilename))
      const controllerPath = path.join(internalTmpControllersFilepath, controllerFilename)
      if (existsSync(controllerPath)) await fs.rm(controllerPath)

      await generateController({
        fullyQualifiedControllerName: 'Internal/Posts',
        actions: [],
        singular: false,
      })
      const actual = await fs.readFile(controllerPath)
      expect(actual.toString()).toEqual(expected.toString())
    })

    context('namespaced controller', () => {
      it('the controller extends a base controller which extends AuthedController', async () => {
        const controllerFilename = 'PostsController.ts'
        const expectedBase = await fs.readFile(path.join(internalSupportDir, 'Api', 'BaseController.ts'))
        const expected = await fs.readFile(path.join(internalSupportDir, 'Api', controllerFilename))
        const basePath = path.join(internalTmpControllersFilepath, 'Api', 'BaseController.ts')
        if (existsSync(basePath)) await fs.rm(basePath)
        const controllerPath = path.join(internalTmpControllersFilepath, 'Api', controllerFilename)
        if (existsSync(controllerPath)) await fs.rm(controllerPath)

        await generateController({
          fullyQualifiedControllerName: 'Internal/Api/Posts',
          actions: [],
          singular: false,
        })
        const actualBase = await fs.readFile(basePath)
        const actual = await fs.readFile(controllerPath)
        expect(actualBase.toString()).toEqual(expectedBase.toString())
        expect(actual.toString()).toEqual(expected.toString())
      })
    })

    context('nested namespaced controller', () => {
      it('the controller extends a base controller which extends AuthedController', async () => {
        const controllerFilename = 'PostsController.ts'
        const expectedBase = await fs.readFile(path.join(internalSupportDir, 'Api', 'BaseController.ts'))
        const expectedNestedBase = await fs.readFile(
          path.join(internalSupportDir, 'Api', 'V1', 'BaseController.ts'),
        )
        const expected = await fs.readFile(path.join(internalSupportDir, 'Api', 'V1', controllerFilename))

        const basePath = path.join(internalTmpControllersFilepath, 'Api', 'BaseController.ts')
        if (existsSync(basePath)) await fs.rm(basePath)
        const nestedBasePath = path.join(internalTmpControllersFilepath, 'Api', 'V1', 'BaseController.ts')
        if (existsSync(nestedBasePath)) await fs.rm(nestedBasePath)

        const controllerPath = path.join(internalTmpControllersFilepath, 'Api', 'V1', controllerFilename)
        if (existsSync(controllerPath)) await fs.rm(controllerPath)

        await generateController({
          fullyQualifiedControllerName: 'Internal/Api/V1/Posts',
          actions: [],
          singular: false,
        })
        const actualBase = await fs.readFile(basePath)
        const actualNestedBase = await fs.readFile(nestedBasePath)
        const actual = await fs.readFile(controllerPath)
        expect(actualBase.toString()).toEqual(expectedBase.toString())
        expect(actualNestedBase.toString()).toEqual(expectedNestedBase.toString())
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })

  context('importExtension is set on DreamApp', () => {
    async function generatePostsController() {
      const controllerFilename = 'PostsController.ts'
      const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
      if (existsSync(controllerPath)) await fs.rm(controllerPath)

      await generateController({
        fullyQualifiedControllerName: 'Posts',
        actions: [],
        singular: false,
      })
      return (await fs.readFile(controllerPath)).toString()
    }

    context('importExtension=.js', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.js')
      })

      it('styles all imports to have .js suffix', async () => {
        expect(await generatePostsController()).toContain(
          "import AuthedController from './AuthedController.js'",
        )
      })
    })

    context('importExtension=.ts', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('.ts')
      })

      it('styles all imports to have .ts suffix', async () => {
        expect(await generatePostsController()).toContain(
          "import AuthedController from './AuthedController.ts'",
        )
      })
    })

    context('importExtension=none', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('none')
      })

      it('styles all imports to have no suffix', async () => {
        expect(await generatePostsController()).toContain("import AuthedController from './AuthedController'")
      })

      context('with a model', () => {
        it('styles the ancestor controller import and the model import with the same (no) suffix', async () => {
          const controllerFilename = 'PostsController.ts'
          const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
          if (existsSync(controllerPath)) await fs.rm(controllerPath)

          await generateController({
            fullyQualifiedControllerName: 'Posts',
            fullyQualifiedModelName: 'Post',
            actions: ['index'],
            singular: false,
          })
          const actual = (await fs.readFile(controllerPath)).toString()
          expect(actual).toContain("import AuthedController from './AuthedController'")
          expect(actual).toContain("import Post from '@models/Post'")
          expect(actual).not.toContain('.js')
        })
      })
    })
  })

  context('importExtension is set only on PsychicApp (psy.set in conf/app.ts)', () => {
    it('forwards the style to Dream, so the ancestor controller import and the model import both carry it', async () => {
      PsychicApp.getOrFail().set('importExtension', 'none')

      const controllerFilename = 'PostsController.ts'
      const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
      if (existsSync(controllerPath)) await fs.rm(controllerPath)

      await generateController({
        fullyQualifiedControllerName: 'Posts',
        fullyQualifiedModelName: 'Post',
        actions: ['index'],
        singular: false,
      })
      const actual = (await fs.readFile(controllerPath)).toString()
      expect(actual).toContain("import AuthedController from './AuthedController'")
      expect(actual).toContain("import Post from '@models/Post'")
      expect(actual).not.toContain('.js')
    })

    it('does not read a PsychicApp-held value: a mocked PsychicApp getter leaves the Dream style in place', async () => {
      vi.spyOn(PsychicApp.prototype, 'importExtension', 'get').mockReturnValue('none')

      const controllerFilename = 'PostsController.ts'
      const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
      if (existsSync(controllerPath)) await fs.rm(controllerPath)

      await generateController({
        fullyQualifiedControllerName: 'Posts',
        actions: [],
        singular: false,
      })
      const actual = (await fs.readFile(controllerPath)).toString()
      expect(actual).toContain("import AuthedController from './AuthedController.js'")
    })
  })

  context('when the controller or its spec already exists', () => {
    const controllerRelPath = path.join('spec', 'tmp', 'controllers', 'Api', 'PostsController.ts')
    const specRelPath = path.join('spec', 'tmp', 'controllers', 'Api', 'PostsController.spec.ts')
    const baseControllerRelPath = path.join('spec', 'tmp', 'controllers', 'Api', 'BaseController.ts')
    let controllerPath: string
    let specPath: string
    let baseControllerPath: string
    let generatedController: string
    let generatedSpec: string
    let generatedBaseController: string

    async function generatePosts({ overwrite }: { overwrite?: boolean } = {}) {
      await generateController({
        fullyQualifiedControllerName: 'Api/Posts',
        fullyQualifiedModelName: 'Post',
        actions: ['index', 'show'],
        singular: false,
        ...(overwrite === undefined ? {} : { overwrite }),
      })
    }

    async function read(filePath: string) {
      return (await fs.readFile(filePath)).toString()
    }

    beforeEach(async () => {
      controllerPath = path.join(psychicApp.apiRoot, controllerRelPath)
      specPath = path.join(psychicApp.apiRoot, specRelPath)
      baseControllerPath = path.join(psychicApp.apiRoot, baseControllerRelPath)

      // what a run over fresh targets writes
      await generatePosts()
      generatedController = await read(controllerPath)
      generatedSpec = await read(specPath)
      generatedBaseController = await read(baseControllerPath)
      await clearTmpControllers()
      await fs.mkdir(path.dirname(controllerPath), { recursive: true })
    })

    it('refuses, writing nothing, when the controller exists with different content', async () => {
      await fs.writeFile(controllerPath, 'hand-written controller')

      const error = await generatePosts().catch((error: unknown) => error)

      expect(error).toBeInstanceOf(ControllerFilesAlreadyExist)
      expect((error as Error).message).toContain(controllerRelPath)
      expect((error as Error).message).not.toContain(specRelPath)
      expect(await read(controllerPath)).toEqual('hand-written controller')
      expect(existsSync(specPath)).toBe(false)
      expect(existsSync(baseControllerPath)).toBe(false)
    })

    it('refuses, writing nothing, when the controller spec exists with different content', async () => {
      await fs.writeFile(specPath, 'hand-written spec')

      const error = await generatePosts().catch((error: unknown) => error)

      expect(error).toBeInstanceOf(ControllerFilesAlreadyExist)
      expect((error as Error).message).toContain(specRelPath)
      expect((error as Error).message).not.toContain(controllerRelPath)
      expect(await read(specPath)).toEqual('hand-written spec')
      expect(existsSync(controllerPath)).toBe(false)
      expect(existsSync(baseControllerPath)).toBe(false)
    })

    it('lists every existing file that differs, and names --overwrite as the way to replace them', async () => {
      await fs.writeFile(controllerPath, 'hand-written controller')
      await fs.writeFile(specPath, 'hand-written spec')

      await expect(generatePosts()).rejects.toThrow(
        `Refusing to generate Api/PostsController, because these files already exist with different content:
  ${controllerRelPath}
  ${specRelPath}

Nothing was written. To replace them, re-run with --overwrite.`,
      )
      expect(await read(controllerPath)).toEqual('hand-written controller')
      expect(await read(specPath)).toEqual('hand-written spec')
    })

    it('refuses without prompting, even on an interactive terminal', async () => {
      const cliPromptSpy = vi.spyOn(cliPromptModule, 'default')
      const isTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
      Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
      await fs.writeFile(controllerPath, 'hand-written controller')

      try {
        await expect(generatePosts()).rejects.toBeInstanceOf(ControllerFilesAlreadyExist)
      } finally {
        if (isTTYDescriptor) Object.defineProperty(process.stdin, 'isTTY', isTTYDescriptor)
        else delete (process.stdin as { isTTY?: boolean }).isTTY
      }

      expect(cliPromptSpy).not.toHaveBeenCalled()
    })

    it('does not refuse when the existing files are identical to what it would write', async () => {
      await fs.writeFile(controllerPath, generatedController)
      await fs.writeFile(specPath, generatedSpec)

      await generatePosts()

      expect(await read(controllerPath)).toEqual(generatedController)
      expect(await read(specPath)).toEqual(generatedSpec)
      expect(await read(baseControllerPath)).toEqual(generatedBaseController)
    })

    context('with overwrite', () => {
      it('replaces the differing controller and spec, and keeps an existing BaseController', async () => {
        await fs.writeFile(controllerPath, 'hand-written controller')
        await fs.writeFile(specPath, 'hand-written spec')
        await fs.writeFile(baseControllerPath, 'hand-written base controller')

        await generatePosts({ overwrite: true })

        expect(await read(controllerPath)).toEqual(generatedController)
        expect(await read(specPath)).toEqual(generatedSpec)
        expect(await read(baseControllerPath)).toEqual('hand-written base controller')
      })

      it('writes missing files', async () => {
        await fs.writeFile(controllerPath, 'hand-written controller')

        await generatePosts({ overwrite: true })

        expect(await read(controllerPath)).toEqual(generatedController)
        expect(await read(specPath)).toEqual(generatedSpec)
        expect(await read(baseControllerPath)).toEqual(generatedBaseController)
      })
    })
  })
})
