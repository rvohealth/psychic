import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { MockInstance } from 'vitest'
import addResourceToRoutes from '../../../../src/generate/helpers/addResourceToRoutes.js'
import * as psychicPathModule from '../../../../src/helpers/path/psychicPath.js'
import PsychicApp from '../../../../src/psychic-app/index.js'

function routesFile(body: string) {
  return `\
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(r: PsychicRouter) {
${body}}
`
}

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

  async function readRoutes() {
    return (await fs.readFile(tmpRoutesFilepath)).toString()
  }

  async function addRoute(
    routesBefore: string,
    route: string,
    options: { singular: boolean; onlyActions: string[] | undefined } = {
      singular: false,
      onlyActions: undefined,
    },
  ) {
    await fs.writeFile(tmpRoutesFilepath, routesBefore)
    await addResourceToRoutes(route, options)
    return await readRoutes()
  }

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

  context('a nested resource', () => {
    it('renders the resource into the file', async () => {
      await fs.writeFile(tmpRoutesFilepath, await fs.readFile(path.join(supportDir, 'boilerplate.ts')))
      const expected = await fs.readFile(path.join(supportDir, 'nestedResource.ts'))
      await addResourceToRoutes('tickets/{}/comments', { singular: false, onlyActions: undefined })
      const actual = await fs.readFile(tmpRoutesFilepath)
      expect(actual.toString()).toEqual(expected.toString())
    })

    context('within a resource already in the file', () => {
      it('renders the resource into the file', async () => {
        await fs.writeFile(
          tmpRoutesFilepath,
          await fs.readFile(path.join(supportDir, 'namespacedTicketsResource.ts')),
        )
        const expected = await fs.readFile(
          path.join(supportDir, 'nestedResourceAddedToNamespacedResource.ts'),
        )
        await addResourceToRoutes('api/v1/tickets/{}/comments', { singular: false, onlyActions: undefined })
        const actual = await fs.readFile(tmpRoutesFilepath)
        expect(actual.toString()).toEqual(expected.toString())
      })
    })
  })

  context('when the namespace is not the first child of its parent block', () => {
    it('adds the resource inside the existing namespace instead of writing a second one', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('places')
    })
    r.namespace('guest', r => {
      r.resources('bookings')
    })
  })
`),
        'v1/guest/reviews',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('places')
    })
    r.namespace('guest', r => {
      r.resources('reviews')

      r.resources('bookings')
    })
  })
`),
      )
    })

    it('writes only the wrappers that are missing beneath it', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('pets')
    r.namespace('host', r => {
      r.resources('bookings')
    })
  })
`),
        'v1/host/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('pets')
    r.namespace('host', r => {
      r.resources('places', r => {
        r.resources('rooms')
      })

      r.resources('bookings')
    })
  })
`),
      )
    })
  })

  context('when the parent resource is not the first child of its block', () => {
    it('converts that parent to the callback form and nests the resource in it', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')
      r.resources('places')
    })
  })
`),
        'v1/host/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')
      r.resources('places', r => {
        r.resources('rooms')

      })
    })
  })
`),
      )
    })
  })

  context('when the parent resource already has a block and is not the first child', () => {
    it('adds the resource to that block instead of writing a second one', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')
      r.resources('places', r => {
        r.resources('rooms')
      })
    })
  })
`),
        'v1/host/places/{}/bookings',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')
      r.resources('places', r => {
        r.resources('bookings')

        r.resources('rooms')
      })
    })
  })
`),
      )
    })
  })

  context('when the parent resource is declared with options', () => {
    it('keeps its only option and adds no unrestricted duplicate', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')
      r.resources('places', { only: ['index', 'show'] })
    })
  })
`),
        'v1/host/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')
      r.resources('places', { only: ['index', 'show'] }, r => {
        r.resources('rooms')

      })
    })
  })
`),
      )
    })

    it('keeps its except option and adds no unrestricted duplicate', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('places', { except: ['destroy'] })
  })
`),
        'v1/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('places', { except: ['destroy'] }, r => {
      r.resources('rooms')

    })
  })
`),
      )
    })

    it('adds the resource to a block the parent already has alongside its options', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('bookings')
    r.resources('places', { only: ['index', 'show'] }, r => {
      r.resources('photos')
    })
  })
`),
        'v1/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('bookings')
    r.resources('places', { only: ['index', 'show'] }, r => {
      r.resources('rooms')

      r.resources('photos')
    })
  })
`),
      )
    })
  })

  context('when a resource named like the parent is declared under another namespace first', () => {
    it('converts only the parent on the route', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('guest', r => {
      r.resources('places')
    })
    r.namespace('host', r => {
      r.resources('places')
    })
  })
`),
        'v1/host/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('guest', r => {
      r.resources('places')
    })
    r.namespace('host', r => {
      r.resources('places', r => {
        r.resources('rooms')

      })
    })
  })
`),
      )
    })

    it('leaves a more deeply nested resource with that name alone', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('guest', r => {
      r.namespace('archive', r => {
        r.resources('places')
      })
    })
    r.namespace('host', r => {
      r.resources('places')
    })
  })
`),
        'v1/host/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('guest', r => {
      r.namespace('archive', r => {
        r.resources('places')
      })
    })
    r.namespace('host', r => {
      r.resources('places', r => {
        r.resources('rooms')

      })
    })
  })
`),
      )
    })
  })

  context('when a block on the route is declared more than once in its parent', () => {
    it('nests the resource under a parent declared in a later block instead of adding an unrestricted parent', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('reviews')
    })

    r.namespace('guest', r => {
      r.resources('bookings')
    })

    r.namespace('host', r => {
      r.resources('places', { only: ['index', 'show'] })
    })
  })
`),
        'v1/host/places/{}/rooms',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('reviews')
    })

    r.namespace('guest', r => {
      r.resources('bookings')
    })

    r.namespace('host', r => {
      r.resources('places', { only: ['index', 'show'] }, r => {
        r.resources('rooms')

      })
    })
  })
`),
      )
    })

    it('adds the resource inside a namespace declared only in a later block', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('reviews')
    })

    r.namespace('host', r => {
      r.namespace('archive', r => {
        r.resources('places')
      })
    })
  })
`),
        'v1/host/archive/bookings',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('reviews')
    })

    r.namespace('host', r => {
      r.namespace('archive', r => {
        r.resources('bookings')

        r.resources('places')
      })
    })
  })
`),
      )
    })

    it('leaves the file unchanged when a later block already declares the resource', async () => {
      const before = routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('reviews')
    })

    r.namespace('host', r => {
      r.resources('places')
    })
  })
`)

      expect(await addRoute(before, 'v1/host/places')).toEqual(before)
    })

    it('adds the resource to the first block when no block declares more of the route', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('reviews')
    })

    r.namespace('host', r => {
      r.resources('places')
    })
  })
`),
        'v1/host/bookings',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')

      r.resources('reviews')
    })

    r.namespace('host', r => {
      r.resources('places')
    })
  })
`),
      )
    })
  })

  context('when the routes function is an arrow function', () => {
    it('adds the resource to it', async () => {
      const routes = await addRoute(
        `\
import { PsychicRouter } from '@rvoh/psychic'

export const routes = (r: PsychicRouter) => {
  r.resources('pets')
}
`,
        'posts',
      )

      expect(routes).toEqual(`\
import { PsychicRouter } from '@rvoh/psychic'

export const routes = (r: PsychicRouter) => {
  r.resources('posts')

  r.resources('pets')
}
`)
    })
  })

  context('when a namespace is declared with double quotes', () => {
    it('adds the resource inside it', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace("v1", r => {
    r.resources("pets")
  })
`),
        'v1/posts',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace("v1", r => {
    r.resources('posts')

    r.resources("pets")
  })
`),
      )
    })
  })

  context('when the same resource is generated a second time', () => {
    let consoleWarnSpy: MockInstance<typeof console.warn>

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })

    function warning() {
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      return String(consoleWarnSpy.mock.calls[0]?.[0])
    }

    const reruns: [string, { singular: boolean; onlyActions: string[] | undefined }][] = [
      ['posts', { singular: false, onlyActions: undefined }],
      ['post', { singular: true, onlyActions: undefined }],
      ['posts', { singular: false, onlyActions: ['create', 'show'] }],
      ['api/v1/posts', { singular: false, onlyActions: undefined }],
      ['v1/host/places/{}/rooms', { singular: false, onlyActions: undefined }],
    ]

    for (const [route, options] of reruns) {
      const description = [
        route,
        options.singular ? '(singular)' : undefined,
        options.onlyActions ? `--only=${options.onlyActions.join(',')}` : undefined,
      ]
        .filter(Boolean)
        .join(' ')

      it(`leaves the routes file unchanged on the second run of "${description}"`, async () => {
        const boilerplate = (await fs.readFile(path.join(supportDir, 'boilerplate.ts'))).toString()
        const afterFirstRun = await addRoute(boilerplate, route, options)
        expect(afterFirstRun).not.toEqual(boilerplate)

        await addResourceToRoutes(route, options)
        expect(await readRoutes()).toEqual(afterFirstRun)
        expect(consoleWarnSpy).not.toHaveBeenCalled()
      })
    }

    it('leaves an existing nested declaration of the resource alone', async () => {
      const before = routesFile(`\
  r.namespace('v1', r => {
    r.resources('pets')
    r.resources('places', r => {
      r.resources('rooms')
    })
  })
`)

      expect(await addRoute(before, 'v1/places')).toEqual(before)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('replaces the actions of the declaration in place when --only narrows them', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('pets')
    r.resources('posts')
    r.resources('tags')
  })
`),
        'v1/posts',
        { singular: false, onlyActions: ['index', 'show'] },
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('pets')
    r.resources('posts', { only: ['index', 'show'] })
    r.resources('tags')
  })
`),
      )
    })

    it('replaces the actions of the declaration in place when --only widens them', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.resources('pets')
  r.resources('posts', { only: ['index'] })
`),
        'posts',
        { singular: false, onlyActions: ['index', 'create', 'show'] },
      )

      expect(routes).toEqual(
        routesFile(`\
  r.resources('pets')
  r.resources('posts', { only: ['index', 'create', 'show'] })
`),
      )
    })

    it('removes the options of the declaration when the re-run has no --only', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.resources('posts', { only: ['index'] })
`),
        'posts',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.resources('posts')
`),
      )
    })

    it('replaces the actions of a singular resource', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.resource('profile', { only: ['show'] })
`),
        'profile',
        { singular: true, onlyActions: ['show', 'update'] },
      )

      expect(routes).toEqual(
        routesFile(`\
  r.resource('profile', { only: ['show', 'update'] })
`),
      )
    })

    it('keeps the callback of the declaration and the routes nested in it', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('places', r => {
      r.resources('rooms')
    })
  })
`),
        'v1/places',
        { singular: false, onlyActions: ['index', 'show'] },
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('places', { only: ['index', 'show'] }, r => {
      r.resources('rooms')
    })
  })
`),
      )
    })

    it('keeps the callback of a declaration with options when the re-run removes them', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('places', { only: ['index'] }, r => {
      r.resources('rooms')
    })
  })
`),
        'v1/places',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('places', r => {
      r.resources('rooms')
    })
  })
`),
      )
    })

    it('replaces a hand-written except, routing every action when the re-run has no --only', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.resources('posts', { except: ['destroy'] })
`),
        'posts',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.resources('posts')
`),
      )
    })

    it('replaces an only and except pair together', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.resources('posts', { only: ['index', 'show'], except: ['show'] })
`),
        'posts',
        { singular: false, onlyActions: ['create'] },
      )

      expect(routes).toEqual(
        routesFile(`\
  r.resources('posts', { only: ['create'] })
`),
      )
    })

    const sameActions: [string, string, { singular: boolean; onlyActions: string[] | undefined }][] = [
      [
        'the same actions in another order',
        "{ only: ['show', 'create'] }",
        { singular: false, onlyActions: ['create', 'show'] },
      ],
      [
        'every action but the excepted one',
        "{ except: ['destroy'] }",
        { singular: false, onlyActions: ['index', 'create', 'show', 'update'] },
      ],
      [
        'every action by name',
        "{ only: ['index', 'create', 'show', 'update', 'destroy'] }",
        { singular: false, onlyActions: undefined },
      ],
      [
        'the same actions in double quotes',
        '{ only: ["index", "show"], }',
        { singular: false, onlyActions: ['index', 'show'] },
      ],
    ]

    for (const [description, existingOptions, options] of sameActions) {
      it(`leaves a declaration routing ${description} unchanged`, async () => {
        const before = routesFile(`\
  r.resources('posts', ${existingOptions})
`)

        expect(await addRoute(before, 'posts', options)).toEqual(before)
        expect(consoleWarnSpy).not.toHaveBeenCalled()
      })
    }

    context('when the declaration cannot be rewritten', () => {
      it('leaves the file unchanged and prints the existing and wanted lines when the declaration names its controller', async () => {
        const before = routesFile(`\
  r.namespace('v1', r => {
    r.resources('posts', { controller: PostsController })
  })
`)

        expect(await addRoute(before, 'v1/posts', { singular: false, onlyActions: ['index'] })).toEqual(
          before,
        )
        expect(warning()).toEqual(`
Could not update the route for v1/posts in spec/tmp/routes.ts:
  line 5, \`r.resources('posts', { controller: PostsController })\`, declares resources 'posts' with options other than \`only\` and \`except\` lists of action names, which the generator does not rewrite

The file was left unchanged. Edit the route by hand so that it declares the resource once, with these actions, keeping any routes nested in it:

  r.namespace('v1', r => {
    r.resources('posts', { only: ['index'] })
  })
`)
      })

      it('leaves the file unchanged when the actions are not a list of action names', async () => {
        const before = routesFile(`\
  r.resources('posts', { only: postActions })
`)

        expect(await addRoute(before, 'posts')).toEqual(before)
        expect(warning()).toContain(
          "line 4, `r.resources('posts', { only: postActions })`, declares resources 'posts' with options other than",
        )
      })

      it('leaves the file unchanged and prints every declaration when the resource is declared more than once in its block', async () => {
        const before = routesFile(`\
  r.resources('posts', { only: ['index'] })
  r.resources('pets')
  r.resources('posts', { only: ['show'] })
`)

        expect(await addRoute(before, 'posts', { singular: false, onlyActions: ['index'] })).toEqual(before)
        expect(warning()).toContain(`\
  resources 'posts' is declared more than once on the route, and the generator edits only a single declaration:
    line 4: r.resources('posts', { only: ['index'] })
    line 6: r.resources('posts', { only: ['show'] })`)
        expect(warning()).toContain(`\
The file was left unchanged. Edit the route by hand so that it declares the resource once, with these actions, keeping any routes nested in it:

  r.resources('posts', { only: ['index'] })`)
      })

      it('leaves the file unchanged when the resource is declared in two blocks of its namespace', async () => {
        const before = routesFile(`\
  r.namespace('v1', r => {
    r.resources('posts')
  })
  r.namespace('v1', r => {
    r.resources('posts')
  })
`)

        expect(await addRoute(before, 'v1/posts')).toEqual(before)
        expect(warning()).toContain(`\
    line 5: r.resources('posts')
    line 8: r.resources('posts')`)
      })

      it('leaves the file unchanged when another block on the route cannot be read', async () => {
        const before = routesFile(`\
  r.namespace('v1', r => {
    r.resources('posts')
  })
  r.namespace('v1', router => {
    router.resources('posts')
  })
`)

        expect(await addRoute(before, 'v1/posts', { singular: false, onlyActions: ['index'] })).toEqual(
          before,
        )
        expect(warning()).toContain('Could not update the route for v1/posts in spec/tmp/routes.ts')
        expect(warning()).toContain(
          "line 7, `r.namespace('v1', router => {`, declares namespace 'v1' in a form the generator does not edit",
        )
      })
    })
  })

  context('when the routes file holds a block comment', () => {
    let consoleWarnSpy: MockInstance<typeof console.warn>

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })

    it('adds a live declaration of a resource declared only inside the comment', async () => {
      const routes = await addRoute(
        routesFile(`\
  /*
  r.resources('posts')
  */
`),
        'posts',
        { singular: false, onlyActions: ['index'] },
      )

      expect(routes).toEqual(
        routesFile(`\
  r.resources('posts', { only: ['index'] })

  /*
  r.resources('posts')
  */
`),
      )
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('adds a live declaration when the comment opens after code on a line', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.resources('pets') /*
  r.resources('posts')
  */
`),
        'posts',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.resources('posts')

  r.resources('pets') /*
  r.resources('posts')
  */
`),
      )
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('rewrites only the live declaration of a resource also declared inside the comment', async () => {
      const routes = await addRoute(
        routesFile(`\
  /*
  r.resources('posts')
  */
  r.resources('posts', { only: ['show'] })
`),
        'posts',
        { singular: false, onlyActions: ['index'] },
      )

      expect(routes).toEqual(
        routesFile(`\
  /*
  r.resources('posts')
  */
  r.resources('posts', { only: ['index'] })
`),
      )
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('writes a live namespace instead of adding the resource to one declared inside the comment', async () => {
      const routes = await addRoute(
        routesFile(`\
  /*
  r.namespace('v1', r => {
    r.resources('pets')
  })
  */
`),
        'v1/posts',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('posts')
  })

  /*
  r.namespace('v1', r => {
    r.resources('pets')
  })
  */
`),
      )
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('reads a block whose comment ends less indented than the block', async () => {
      const routes = await addRoute(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('pets')
    /*
    r.resources('posts')
*/
  })
`),
        'v1/posts',
      )

      expect(routes).toEqual(
        routesFile(`\
  r.namespace('v1', r => {
    r.resources('posts')

    r.resources('pets')
    /*
    r.resources('posts')
*/
  })
`),
      )
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('leaves the file unchanged when the resource is declared after the end of the comment on its last line', async () => {
      const before = routesFile(`\
  /*
  r.resources('posts')
  */ r.resources('posts', { only: ['show'] })
`)

      expect(await addRoute(before, 'posts', { singular: false, onlyActions: ['index'] })).toEqual(before)
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(String(consoleWarnSpy.mock.calls[0]?.[0])).toContain(
        "line 6, `*/ r.resources('posts', { only: ['show'] })`, declares resources 'posts' in a form the generator does not edit",
      )
    })

    const linesOpeningNoComment: [string, string][] = [
      ['a comment opened and closed on one line', "  /* r.resources('posts') */"],
      ['a /* inside a string', "  r.get('files/*path', FilesController, 'show')"],
      ['a /* inside a line comment', '  // the routes below replaced /* the old ones'],
    ]

    for (const [description, line] of linesOpeningNoComment) {
      it(`reads the lines after ${description}`, async () => {
        const routes = await addRoute(
          routesFile(`\
${line}
  r.resources('posts', { only: ['show'] })
`),
          'posts',
          { singular: false, onlyActions: ['index'] },
        )

        expect(routes).toEqual(
          routesFile(`\
${line}
  r.resources('posts', { only: ['index'] })
`),
        )
        expect(consoleWarnSpy).not.toHaveBeenCalled()
      })
    }
  })

  context('when the routes file declares a block in a form the generator does not edit', () => {
    let consoleWarnSpy: MockInstance<typeof console.warn>

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })

    function warning() {
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      return String(consoleWarnSpy.mock.calls[0]?.[0])
    }

    it('leaves the file unchanged when the options of the parent resource span several lines', async () => {
      const before = routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('bookings')
      r.resources('places', {
        only: ['index', 'show'],
      })
    })
  })
`)

      expect(await addRoute(before, 'v1/host/places/{}/rooms')).toEqual(before)
      expect(warning()).toContain('Could not add the route for v1/host/places/{}/rooms to spec/tmp/routes.ts')
      expect(warning()).toContain(
        "line 7, `r.resources('places', {`, declares resources 'places' in a form the generator does not edit",
      )
      expect(warning()).toContain(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('places', r => {
        r.resources('rooms')
      })
    })
  })`)
    })

    it('leaves the file unchanged when the call is split before the name of the parent', async () => {
      const before = routesFile(`\
  r.namespace('v1', r => {
    r.resources(
      'places',
      { only: ['index', 'show', 'create', 'update', 'destroy'] },
      r => {
        r.resources('photos')
      },
    )
  })
`)

      expect(await addRoute(before, 'v1/places/{}/rooms')).toEqual(before)
      expect(warning()).toContain(
        "line 5, `r.resources(`, declares resources 'places' in a form the generator does not edit",
      )
    })

    it('leaves the file unchanged when a namespace callback names its router differently', async () => {
      const before = routesFile(`\
  r.namespace('v1', router => {
    router.resources('pets')
  })
`)

      expect(await addRoute(before, 'v1/posts')).toEqual(before)
      expect(warning()).toContain(
        "line 4, `r.namespace('v1', router => {`, declares namespace 'v1' in a form the generator does not edit",
      )
    })

    it('leaves the file unchanged when a later block with the same name is declared in a form it does not edit', async () => {
      const before = routesFile(`\
  r.namespace('v1', r => {
    r.namespace('host', r => {
      r.resources('reviews')
    })
    r.namespace('host', router => {
      router.resources('places', { only: ['index', 'show'] })
    })
  })
`)

      expect(await addRoute(before, 'v1/host/places/{}/rooms')).toEqual(before)
      expect(warning()).toContain(
        "line 8, `r.namespace('host', router => {`, declares namespace 'host' in a form the generator does not edit",
      )
    })

    const tabIndentedRoutes: [string, string][] = [
      [
        'v1/posts',
        "\tr.namespace('admin', r => {\n\t\tr.namespace('v1', r => {\n\t\t\tr.resources('pets')\n\t\t})\n\t})\n",
      ],
      [
        'places/{}/rooms',
        "\tr.namespace('guest', r => {\n\t\tr.resources('places')\n\t})\n\tr.resources('places')\n",
      ],
      ['posts', "\tr.namespace('v1', r => {\n\t\tr.resources('posts')\n\t})\n"],
    ]

    for (const [route, body] of tabIndentedRoutes) {
      it(`leaves the file unchanged and says why when adding ${route} to a routes function indented with tabs`, async () => {
        const before = routesFile(body)

        expect(await addRoute(before, route)).toEqual(before)
        expect(warning()).toContain(
          'the routes function is indented with tabs; the generator edits only 2-space indentation',
        )
      })
    }

    it('leaves the file unchanged when the resource itself is declared in a form it does not edit', async () => {
      const before = routesFile(`\
  r.resources('posts', {
    only: ['index'],
  })
`)

      expect(await addRoute(before, 'posts')).toEqual(before)
      expect(warning()).toContain(
        "line 4, `r.resources('posts', {`, declares resources 'posts' in a form the generator does not edit",
      )
    })

    it('leaves the file unchanged when a block on the route has no closer at its indentation', async () => {
      const before = routesFile(`\
  r.namespace('v1', r => {
  r.resources('pets')
  })
`)

      expect(await addRoute(before, 'v1/posts')).toEqual(before)
      expect(warning()).toContain(
        "the block opened on line 4, `r.namespace('v1', r => {`, has no `})` closing it at the same indentation",
      )
    })

    it('leaves the file unchanged when no routes function taking `r` is found', async () => {
      const before = `\
import { PsychicRouter } from '@rvoh/psychic'

export default function routes(router: PsychicRouter) {
  router.resources('pets')
}
`

      expect(await addRoute(before, 'posts')).toEqual(before)
      expect(warning()).toContain('no `export ... (r: PsychicRouter) {` routes function was found')
      expect(warning()).toContain(`r.resources('posts')`)
    })
  })
})
