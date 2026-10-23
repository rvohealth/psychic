import { DreamCLI } from '@rvoh/dream/system'
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
  let generateControllerSpy: MockInstance<typeof generateControllerModule.default>

  beforeEach(() => {
    const tmpRoutesFileRelativePath = path.join('spec', 'tmp', 'routes.ts')
    tmpRoutesFilepath = path.join(PsychicApp.getOrFail().apiRoot, tmpRoutesFileRelativePath)
    vi.spyOn(psychicPathModule, 'default').mockReturnValue(tmpRoutesFileRelativePath)
    vi.spyOn(DreamCLI, 'generateDream').mockResolvedValue(undefined)
    generateControllerSpy = vi.spyOn(generateControllerModule, 'default').mockResolvedValue(undefined)
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
    expect(generateControllerSpy).toHaveBeenCalledTimes(1)
    return generateControllerSpy.mock.calls[0]?.[0].actions
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
