import { DreamCLI } from '@rvoh/dream/system'
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { MockInstance } from 'vitest'
import * as generateControllerModule from '../../../src/generate/controller.js'
import generateResource from '../../../src/generate/resource.js'
import * as psychicPathModule from '../../../src/helpers/path/psychicPath.js'
import PsychicApp from '../../../src/psychic-app/index.js'

function routesFile(body: string) {
  return `\
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
${body}}
`
}

describe('generateResource', () => {
  let tmpRoutesFilepath: string
  let prepareControllerSpy: MockInstance<typeof generateControllerModule.prepareController>

  beforeEach(() => {
    const tmpRoutesFileRelativePath = path.join('spec', 'tmp', 'routes.ts')
    tmpRoutesFilepath = path.join(PsychicApp.getOrFail().apiRoot, tmpRoutesFileRelativePath)
    vi.spyOn(psychicPathModule, 'default').mockReturnValue(tmpRoutesFileRelativePath)
    vi.spyOn(DreamCLI, 'generateDream').mockResolvedValue(undefined)
    prepareControllerSpy = vi
      .spyOn(generateControllerModule, 'prepareController')
      .mockResolvedValue(() => Promise.resolve())
  })

  async function generate(
    routesBefore: string,
    route: string,
    { singular, only }: { singular: boolean; only?: string },
  ) {
    await fs.writeFile(tmpRoutesFilepath, routesBefore)
    await generateResource({
      route,
      fullyQualifiedModelName: singular ? 'User/Profile' : 'Post',
      options: {
        singular,
        ...(only === undefined ? {} : { only }),
        stiBaseSerializer: false,
        connectionName: 'default',
        softDelete: false,
      },
      columnsWithTypes: [],
    })
    return (await fs.readFile(tmpRoutesFilepath)).toString()
  }

  function controllerActions() {
    expect(prepareControllerSpy).toHaveBeenCalledTimes(1)
    return prepareControllerSpy.mock.calls[0]?.[0].actions
  }

  context('when --only names an action the resource does not have', () => {
    it('routes only the actions of the regenerated controller when re-run for a singular resource with an --only naming index', async () => {
      const routes = await generate(
        routesFile(`\
  r.resource('profile', { only: ['show', 'update'] })
`),
        'profile',
        { singular: true, only: 'index,show' },
      )

      expect(controllerActions()).toEqual(['show'])
      expect(routes).toEqual(
        routesFile(`\
  r.resource('profile', { only: ['show'] })
`),
      )
    })

    it('leaves a singular declaration already routing the actions of the regenerated controller unchanged', async () => {
      const before = routesFile(`\
  r.resource('profile', { only: ['show'] })
`)

      expect(await generate(before, 'profile', { singular: true, only: 'index,show' })).toEqual(before)
      expect(controllerActions()).toEqual(['show'])
    })

    it('routes only the actions of the regenerated controller when --only holds a misspelled action', async () => {
      const routes = await generate(
        routesFile(`\
  r.resources('posts')
`),
        'posts',
        { singular: false, only: 'index,shwo' },
      )

      expect(controllerActions()).toEqual(['index'])
      expect(routes).toEqual(
        routesFile(`\
  r.resources('posts', { only: ['index'] })
`),
      )
    })

    it('routes only the actions of the regenerated controller on the first run', async () => {
      const routes = await generate(routesFile(''), 'profile', { singular: true, only: 'index,show,updte' })

      expect(controllerActions()).toEqual(['show'])
      expect(routes).toEqual(
        routesFile(`\
  r.resource('profile', { only: ['show'] })

`),
      )
    })
  })

  it('routes every action of the regenerated controller, with no options, when there is no --only', async () => {
    const routes = await generate(
      routesFile(`\
  r.resource('profile', { only: ['show'] })
`),
      'profile',
      { singular: true },
    )

    expect(controllerActions()).toEqual(['show', 'create', 'update', 'destroy'])
    expect(routes).toEqual(
      routesFile(`\
  r.resource('profile')
`),
    )
  })
})

describe('generateResource over existing files', () => {
  const tmpDir = path.join('spec', 'tmp', 'generate-resource-existing-files')
  const routesRelPath = path.join(tmpDir, 'routes.ts')
  const controllersRelDir = path.join(tmpDir, 'controllers')
  const controllerSpecsRelDir = path.join(tmpDir, 'controller-specs')
  const controllerRelPath = path.join(controllersRelDir, 'V1', 'PostsController.ts')
  const specRelPath = path.join(controllerSpecsRelDir, 'V1', 'PostsController.spec.ts')
  const existingFilesFlags = { overwrite: '--overwrite', skip: '--overwrite-psychic-only' }
  let generateDreamSpy: MockInstance<typeof DreamCLI.generateDream>

  function abs(relPath: string) {
    return path.join(PsychicApp.getOrFail().apiRoot, relPath)
  }

  async function read(relPath: string) {
    return (await fs.readFile(abs(relPath))).toString()
  }

  async function generate(existingFiles?: 'refuse' | 'overwrite' | 'overwritePsychicOnly') {
    await generateResource({
      route: 'v1/posts',
      fullyQualifiedModelName: 'Post',
      options: {
        singular: false,
        stiBaseSerializer: false,
        connectionName: 'default',
        softDelete: false,
        ...(existingFiles === undefined ? {} : { existingFiles }),
      },
      columnsWithTypes: [],
    })
  }

  function existingFilesPassedToDream() {
    expect(generateDreamSpy).toHaveBeenCalledTimes(1)
    const options = generateDreamSpy.mock.calls[0]?.[0].options
    return { existingFiles: options?.existingFiles, existingFilesFlags: options?.existingFilesFlags }
  }

  beforeEach(async () => {
    await fs.rm(abs(tmpDir), { recursive: true, force: true })
    await fs.mkdir(abs(path.join(controllersRelDir, 'V1')), { recursive: true })
    await fs.writeFile(abs(routesRelPath), routesFile(''))
    vi.spyOn(psychicPathModule, 'default').mockImplementation(pathType => {
      switch (pathType) {
        case 'apiRoutes':
          return routesRelPath
        case 'controllers':
          return controllersRelDir
        case 'controllerSpecs':
          return controllerSpecsRelDir
        default:
          throw new Error(`unexpected psychicPath('${pathType}')`)
      }
    })
    generateDreamSpy = vi.spyOn(DreamCLI, 'generateDream').mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await fs.rm(abs(tmpDir), { recursive: true, force: true })
  })

  context('with neither --overwrite nor --overwrite-psychic-only', () => {
    it('refuses before calling Dream when the controller exists with different content, naming both flags', async () => {
      await fs.writeFile(abs(controllerRelPath), 'hand-written controller')

      await expect(generate()).rejects.toThrow(
        `Refusing to generate V1/PostsController, because these files already exist with different content:
  ${controllerRelPath}

Nothing was written. To replace them, re-run with --overwrite, which also replaces any existing model, spec, factory and serializer files for Post. To replace them but keep any existing model, spec, factory, serializer and migration files for Post, writing only the missing ones, re-run with --overwrite-psychic-only.`,
      )
      expect(generateDreamSpy).not.toHaveBeenCalled()
      expect(await read(controllerRelPath)).toEqual('hand-written controller')
      expect(existsSync(abs(specRelPath))).toBe(false)
      expect(await read(routesRelPath)).toEqual(routesFile(''))
    })

    it('refuses before calling Dream when the controller spec exists with different content', async () => {
      await fs.mkdir(abs(path.dirname(specRelPath)), { recursive: true })
      await fs.writeFile(abs(specRelPath), 'hand-written spec')

      await expect(generate()).rejects.toBeInstanceOf(generateControllerModule.ControllerFilesAlreadyExist)
      expect(generateDreamSpy).not.toHaveBeenCalled()
      expect(await read(specRelPath)).toEqual('hand-written spec')
      expect(existsSync(abs(controllerRelPath))).toBe(false)
    })

    it("asks Dream to refuse existing model files, naming Psychic's flags in its refusal", async () => {
      await generate()

      expect(existingFilesPassedToDream()).toEqual({ existingFiles: 'refuse', existingFilesFlags })
      expect(existsSync(abs(controllerRelPath))).toBe(true)
      expect(existsSync(abs(specRelPath))).toBe(true)
    })

    it('does not refuse when the controller and spec are identical to what it would write', async () => {
      await generate()
      generateDreamSpy.mockClear()

      await generate()

      expect(existingFilesPassedToDream()).toEqual({ existingFiles: 'refuse', existingFilesFlags })
    })

    it("writes none of Psychic's files when Dream refuses", async () => {
      const dreamRefusal = new Error('Refusing to generate Post, because these files already exist')
      generateDreamSpy.mockRejectedValue(dreamRefusal)

      await expect(generate()).rejects.toBe(dreamRefusal)
      expect(existsSync(abs(controllerRelPath))).toBe(false)
      expect(existsSync(abs(specRelPath))).toBe(false)
      expect(await read(routesRelPath)).toEqual(routesFile(''))
    })

    it("reaches the user with Dream's listing and Psychic's flags when Dream refuses an existing model", async () => {
      // Post exists in the test app, so Dream refuses before writing anything
      expect(existsSync(abs(path.join('test-app', 'src', 'app', 'models', 'Post.ts')))).toBe(true)
      generateDreamSpy.mockRestore()

      const error = await generate().catch((error: unknown) => error)

      expect((error as Error).message).toContain(
        'Refusing to generate Post, because these files already exist:',
      )
      expect((error as Error).message).toContain(path.join('test-app', 'src', 'app', 'models', 'Post.ts'))
      expect((error as Error).message).toContain('re-run with --overwrite.')
      expect((error as Error).message).toContain('re-run with --overwrite-psychic-only.')
      expect((error as Error).message).not.toContain('--skip-existing')
      expect((error as Error).message).not.toContain('g:model')
      expect(existsSync(abs(controllerRelPath))).toBe(false)
      expect(await read(routesRelPath)).toEqual(routesFile(''))
    })
  })

  context('with --overwrite', () => {
    it("replaces the differing controller and spec and asks Dream to overwrite the model's files", async () => {
      await generate()
      const generatedController = await read(controllerRelPath)
      const generatedSpec = await read(specRelPath)
      await fs.writeFile(abs(controllerRelPath), 'hand-written controller')
      await fs.writeFile(abs(specRelPath), 'hand-written spec')
      generateDreamSpy.mockClear()

      await generate('overwrite')

      expect(existingFilesPassedToDream()).toEqual({ existingFiles: 'overwrite', existingFilesFlags })
      expect(await read(controllerRelPath)).toEqual(generatedController)
      expect(await read(specRelPath)).toEqual(generatedSpec)
    })
  })

  context('with --overwrite-psychic-only', () => {
    it("replaces the differing controller and spec and asks Dream to keep the model's existing files", async () => {
      await generate()
      const generatedController = await read(controllerRelPath)
      const generatedSpec = await read(specRelPath)
      await fs.writeFile(abs(controllerRelPath), 'hand-written controller')
      await fs.writeFile(abs(specRelPath), 'hand-written spec')
      generateDreamSpy.mockClear()

      await generate('overwritePsychicOnly')

      expect(existingFilesPassedToDream()).toEqual({ existingFiles: 'skip', existingFilesFlags })
      expect(await read(controllerRelPath)).toEqual(generatedController)
      expect(await read(specRelPath)).toEqual(generatedSpec)
    })
  })
})
