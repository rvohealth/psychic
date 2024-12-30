import { describe as context } from '@jest/globals'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { generateController, PsychicApplication } from '../../../../src'
import * as psychicPathModule from '../../../../src/helpers/path/psychicPath'

describe('generateController', () => {
  let psychicApp: PsychicApplication
  let tmpControllersFileRelativePath: string
  let tmpControllersFilepath: string
  let adminTmpControllersFilepath: string
  let supportDir: string
  let adminSupportDir: string

  beforeEach(() => {
    psychicApp = PsychicApplication.getOrFail()
    tmpControllersFileRelativePath = path.join('spec', 'tmp', 'controllers')
    tmpControllersFilepath = path.join(psychicApp.apiRoot, tmpControllersFileRelativePath)
    adminTmpControllersFilepath = path.join(tmpControllersFilepath, 'Admin')
    supportDir = path.join(psychicApp.apiRoot, 'spec', 'support', 'generators', 'controllers')
    adminSupportDir = path.join(supportDir, 'Admin')
    jest.spyOn(psychicPathModule, 'default').mockReturnValue(tmpControllersFileRelativePath)
  })

  it('the controller extends AuthedController', async () => {
    const controllerFilename = 'PostsController.ts'
    const expected = await fs.readFile(path.join(supportDir, controllerFilename))
    const controllerPath = path.join(tmpControllersFilepath, controllerFilename)
    if (existsSync(controllerPath)) await fs.rm(controllerPath)

    await generateController({ fullyQualifiedControllerName: 'Posts', actions: [] })
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

      await generateController({ fullyQualifiedControllerName: 'Api/Posts', actions: [] })
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

      await generateController({ fullyQualifiedControllerName: 'Api/V1/Posts', actions: [] })
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

      await generateController({ fullyQualifiedControllerName: 'Admin/Posts', actions: [] })
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

        await generateController({ fullyQualifiedControllerName: 'Admin/Api/Posts', actions: [] })
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

        await generateController({ fullyQualifiedControllerName: 'Admin/Api/V1/Posts', actions: [] })
        const actualBase = await fs.readFile(basePath)
        const actualNestedBase = await fs.readFile(nestedBasePath)
        const actual = await fs.readFile(controllerPath)
        expect(actualBase.toString()).toEqual(expectedBase.toString())
        expect(actualNestedBase.toString()).toEqual(expectedNestedBase.toString())
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })
})
