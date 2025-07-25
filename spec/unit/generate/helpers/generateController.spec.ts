import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as psychicPathModule from '../../../../src/helpers/path/psychicPath.js'
import { generateController, PsychicApp } from '../../../../src/index.js'

describe('generateController', () => {
  let psychicApp: PsychicApp
  let tmpControllersFileRelativePath: string
  let tmpControllersFilepath: string
  let adminTmpControllersFilepath: string
  let supportDir: string
  let adminSupportDir: string

  beforeEach(() => {
    psychicApp = PsychicApp.getOrFail()
    tmpControllersFileRelativePath = path.join('spec', 'tmp', 'controllers')
    tmpControllersFilepath = path.join(psychicApp.apiRoot, tmpControllersFileRelativePath)
    adminTmpControllersFilepath = path.join(tmpControllersFilepath, 'Admin')
    supportDir = path.join(psychicApp.apiRoot, 'spec', 'support', 'generators', 'controllers')
    adminSupportDir = path.join(supportDir, 'Admin')
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

  context('importExtension is set on PsychicApp', () => {
    context('importExtension=.js', () => {
      beforeEach(() => {
        vi.spyOn(PsychicApp.prototype, 'importExtension', 'get').mockReturnValue('.js')
      })

      it('styles all imports to have .js suffix', async () => {
        const controllerFilename = 'PostsController.ts'
        const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
        if (existsSync(controllerPath)) await fs.rm(controllerPath)

        await generateController({
          fullyQualifiedControllerName: 'Posts',
          actions: [],
          singular: false,
        })
        const actual = await fs.readFile(controllerPath)
        expect(actual.toString()).toContain("import AuthedController from './AuthedController.js'")
      })
    })

    context('importExtension=.ts', () => {
      beforeEach(() => {
        vi.spyOn(PsychicApp.prototype, 'importExtension', 'get').mockReturnValue('.ts')
      })

      it('styles all imports to have .ts suffix', async () => {
        const controllerFilename = 'PostsController.ts'
        const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
        if (existsSync(controllerPath)) await fs.rm(controllerPath)

        await generateController({
          fullyQualifiedControllerName: 'Posts',
          actions: [],
          singular: false,
        })
        const actual = await fs.readFile(controllerPath)
        expect(actual.toString()).toContain("import AuthedController from './AuthedController.ts'")
      })
    })

    context('importExtension=none', () => {
      beforeEach(() => {
        vi.spyOn(PsychicApp.prototype, 'importExtension', 'get').mockReturnValue('none')
      })

      it('styles all imports to have no suffix', async () => {
        const controllerFilename = 'PostsController.ts'
        const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
        if (existsSync(controllerPath)) await fs.rm(controllerPath)

        await generateController({
          fullyQualifiedControllerName: 'Posts',
          actions: [],
          singular: false,
        })
        const actual = await fs.readFile(controllerPath)
        expect(actual.toString()).toContain("import AuthedController from './AuthedController'")
      })
    })
  })
})
