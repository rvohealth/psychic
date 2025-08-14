import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import addResourceToRoutes, {
  addResourceToRoutes_routeToRegexAndReplacements,
} from '../../../../src/generate/helpers/addResourceToRoutes.js'
import * as psychicPathModule from '../../../../src/helpers/path/psychicPath.js'
import { PsychicApp } from '../../../../src/index.js'

describe('addResourceToRoutes', () => {
  let psychicApp: PsychicApp
  let tmpRoutesFileRelativePath: string
  let tmpRoutesFilepath: string
  let supportDir: string

  beforeEach(() => {
    psychicApp = PsychicApp.getOrFail()
    tmpRoutesFileRelativePath = path.join('spec', 'tmp', 'routes.ts')
    tmpRoutesFilepath = path.join(psychicApp.apiRoot, tmpRoutesFileRelativePath)
    supportDir = path.join(psychicApp.apiRoot, 'spec', 'support', 'generators', 'routes')
    vi.spyOn(psychicPathModule, 'default').mockReturnValue(tmpRoutesFileRelativePath)
  })

  context('with the boilerplate routes file', () => {
    context('with a simple resource', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(tmpRoutesFilepath, await fs.readFile(path.join(supportDir, 'boilerplate.ts')))
        const expected = await fs.readFile(path.join(supportDir, 'resource.ts'))
        await addResourceToRoutes('posts', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })

    context('with singular:true', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(tmpRoutesFilepath, await fs.readFile(path.join(supportDir, 'boilerplate.ts')))
        const expected = await fs.readFile(path.join(supportDir, 'singularResource.ts'))
        await addResourceToRoutes('post', { singular: true, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })

    context('with onlyActions: "create,show"', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(tmpRoutesFilepath, await fs.readFile(path.join(supportDir, 'boilerplate.ts')))
        const expected = await fs.readFile(path.join(supportDir, 'onlyResource.ts'))
        await addResourceToRoutes('posts', { singular: false, onlyActions: ['create', 'show'] })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })

    context('with a namespaced resource', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(tmpRoutesFilepath, await fs.readFile(path.join(supportDir, 'boilerplate.ts')))
        const expected = await fs.readFile(path.join(supportDir, 'namespacedResource.ts'))
        await addResourceToRoutes('api/posts', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })

    context('with a nested namespaced resource', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(tmpRoutesFilepath, await fs.readFile(path.join(supportDir, 'boilerplate.ts')))
        const expected = await fs.readFile(path.join(supportDir, 'nestedNamespacedResource.ts'))
        await addResourceToRoutes('api/v1/posts', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })

  context('with a routes file with an existing resource', () => {
    context('with a simple resource', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(tmpRoutesFilepath, await fs.readFile(path.join(supportDir, 'resource.ts')))
        const expected = await fs.readFile(path.join(supportDir, 'resourceAddedToResource.ts'))
        await addResourceToRoutes('comments', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })

  context('with a routes file with an existing namespaced resource', () => {
    context('with another resource in the same namespace', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(
          tmpRoutesFilepath,
          await fs.readFile(path.join(supportDir, 'namespacedResource.ts')),
        )
        const expected = await fs.readFile(path.join(supportDir, 'namespacedResourceAddedToNamespace.ts'))
        await addResourceToRoutes('api/comments', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })

    context('with a resource nested within that namespace', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(
          tmpRoutesFilepath,
          await fs.readFile(path.join(supportDir, 'namespacedResource.ts')),
        )
        const expected = await fs.readFile(
          path.join(supportDir, 'nestedNamespacedResourceAddedToNamespace.ts'),
        )
        await addResourceToRoutes('api/v1/comments', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })

  context('with a routes file with an existing nested namespaced resource', () => {
    context('with a resource nested within that namespace', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(
          tmpRoutesFilepath,
          await fs.readFile(path.join(supportDir, 'nestedNamespacedResource.ts')),
        )
        const expected = await fs.readFile(
          path.join(supportDir, 'nestedNamespacedResourceAddedToNestedNamespace.ts'),
        )
        await addResourceToRoutes('api/v1/comments', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })
})

describe('addResourceToRoutes_routeToRegexAndReplacements', () => {
  it('"posts"', () => {
    const results = addResourceToRoutes_routeToRegexAndReplacements('posts', {
      singular: false,
      onlyActions: undefined,
    })
    expect(results[0]!.regex).toEqual(/^export ([^(]+)\(r: PsychicRouter\)([^{]*)\{\n/m)
    expect(results[0]!.replacement).toEqual(`export $1(r: PsychicRouter)$2{\n  r.resources('posts')\n`)
  })

  it('"api/posts"', () => {
    const results = addResourceToRoutes_routeToRegexAndReplacements('api/posts', {
      singular: false,
      onlyActions: undefined,
    })

    const sharedExpectedReplacement = `  r.namespace('api', r => {\n    r.resources('posts')\n`

    expect(results[0]!.regex).toEqual(/^ {2}r\.namespace\('api', r => \{\n/m)
    expect(results[0]!.replacement).toEqual(sharedExpectedReplacement)

    expect(results[1]!.regex).toEqual(/^export ([^(]+)\(r: PsychicRouter\)([^{]*)\{\n/m)
    expect(results[1]!.replacement).toEqual(`export $1(r: PsychicRouter)$2{\n${sharedExpectedReplacement}`)
  })

  it('"api/v1/posts"', () => {
    const results = addResourceToRoutes_routeToRegexAndReplacements('api/v1/posts', {
      singular: false,
      onlyActions: undefined,
    })

    const sharedExpectedReplacement = `  r.namespace('api', r => {\n    r.namespace('v1', r => {\n      r.resources('posts')\n`

    expect(results[0]!.regex).toEqual(/^ {2}r\.namespace\('api', r => \{\n {4}r\.namespace\('v1', r => \{\n/m)
    expect(results[0]!.replacement).toEqual(sharedExpectedReplacement)

    expect(results[1]!.regex).toEqual(/^ {2}r\.namespace\('api', r => \{\n/m)
    expect(results[1]!.replacement).toEqual(sharedExpectedReplacement)

    expect(results[2]!.regex).toEqual(/^export ([^(]+)\(r: PsychicRouter\)([^{]*)\{\n/m)
    expect(results[2]!.replacement).toEqual(`export $1(r: PsychicRouter)$2{\n${sharedExpectedReplacement}`)
  })
})
