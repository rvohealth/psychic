import { DreamApp } from '@rvoh/dream'
import ParamValidationErrors from '../../../src/error/controller/ParamValidationErrors.js'
import type { JSONColumnShapeStatement } from '../../../src/openapi-renderer/helpers/dreamColumnOpenapiShape.js'
import Params from '../../../src/server/params.js'
import User from '../../../test-app/src/app/models/User.js'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'

// A declared shape that renders as OpenAPI but that AJV cannot compile into
// the validator Dream checks the value with, and Params.for checks a request
// value with, is refused while PsychicApp.init runs (by DreamApp.init, which
// it calls), never first at a request. Dream's specs cover each kind of shape
// it refuses; this covers the refusal reaching a Psychic app's boot.

interface DeclaredShapes {
  jsonColumnShapes?: JSONColumnShapeStatement[]
}

// declared on a subclass, as the decorators register them, and set here
// directly, as a declaration that got past the types would be
function userDeclaring(shapes: DeclaredShapes): typeof User {
  class UserWithDeclaredShapes extends User {}
  for (const [key, value] of Object.entries(shapes))
    Object.defineProperty(UserWithDeclaredShapes, key, { value, writable: true, configurable: true })
  return UserWithDeclaredShapes
}

async function bootWith(dreamClass: typeof User) {
  const models = DreamApp.getOrFail().models
  vi.spyOn(DreamApp.prototype, 'models', 'get').mockReturnValue({
    ...models,
    UserWithDeclaredShapes: dreamClass,
  })
  return initializePsychicApp()
}

async function bootErrorWith(dreamClass: typeof User): Promise<Error> {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  let thrownError: Error | undefined
  try {
    await bootWith(dreamClass)
  } catch (err) {
    thrownError = err as Error
  }

  expect(thrownError).toBeInstanceOf(Error)
  return thrownError!
}

describe('PsychicApp#init refuses a declared shape that cannot be compiled', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refuses a @deco.JSON pattern that is invalid under the unicode flag', async () => {
    const error = await bootErrorWith(
      userDeclaring({
        jsonColumnShapes: [
          {
            column: 'jsonbData',
            openapi: {
              type: 'object',
              properties: { phone: { type: 'string', pattern: '^\\d{3}\\-\\d{4}$' } },
            },
          },
        ],
      }),
    )

    // Dream's ModelDeclaredShapeDoesNotCompile, which Dream does not export
    expect(error.constructor.name).toEqual('ModelDeclaredShapeDoesNotCompile')
    expect(error.message).toContain('@deco.JSON on UserWithDeclaredShapes#jsonbData')
    expect(error.message).toMatch(/Invalid regular expression/)
  })

  it('boots with a valid declared shape, which a request then validates', async () => {
    const UserWithValidShape = userDeclaring({
      jsonColumnShapes: [
        {
          column: 'jsonbData',
          openapi: { type: 'object', properties: { phone: { type: 'string', pattern: '^\\d{3}-\\d{4}$' } } },
        },
      ],
    })

    await expect(bootWith(UserWithValidShape)).resolves.toBeDefined()

    expect(Params.for({ jsonbData: { phone: '555-1234' } }, UserWithValidShape)).toEqual({
      jsonbData: { phone: '555-1234' },
    })
    expect(() => Params.for({ jsonbData: { phone: 'nope' } }, UserWithValidShape)).toThrow(
      ParamValidationErrors,
    )
  })
})
