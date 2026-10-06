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
    })
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
