import { DreamApp } from '@rvoh/dream'
import ParamValidationErrors from '../../../src/error/controller/ParamValidationErrors.js'
import type {
  JSONColumnShapeStatement,
  VirtualAttributeStatement,
} from '../../../src/openapi-renderer/helpers/dreamColumnOpenapiShape.js'
import Params from '../../../src/server/params.js'
import User from '../../../test-app/src/app/models/User.js'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'

// A declared shape that renders as OpenAPI but that AJV cannot compile into
// the validator Params.for checks a request value with is refused while
// PsychicApp.init runs, never first at a request.

interface DeclaredShapes {
  jsonColumnShapes?: JSONColumnShapeStatement[]
  virtualAttributes?: VirtualAttributeStatement[]
  encryptedAttributes?: { property: string; encryptedColumnName: string }[]
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

const virtualAttributes = () => [...(User['virtualAttributes'] as VirtualAttributeStatement[])]

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

    expect(error.message).toContain('UserWithDeclaredShapes')
    expect(error.message).toContain('"jsonbData"')
    expect(error.message).toContain('@deco.JSON')
    expect(error.message).toMatch(/Invalid regular expression/)
  })

  it('refuses a @deco.JSON union type, which strict types do not allow', async () => {
    const error = await bootErrorWith(
      userDeclaring({
        jsonColumnShapes: [
          {
            column: 'jsonbData',
            openapi: {
              type: 'object',
              properties: { v: { type: ['string', 'number'] } },
            } as unknown as JSONColumnShapeStatement['openapi'],
          },
        ],
      }),
    )

    expect(error.message).toContain('UserWithDeclaredShapes')
    expect(error.message).toContain('"jsonbData"')
    expect(error.message).toContain('@deco.JSON')
    expect(error.message).toContain('allowUnionTypes')
  })

  it('refuses a composition written in place of the properties map', async () => {
    const error = await bootErrorWith(
      userDeclaring({
        jsonColumnShapes: [
          {
            column: 'jsonbData',
            openapi: {
              type: 'object',
              properties: { oneOf: [{ type: 'object' }, { type: 'array' }] },
            } as unknown as JSONColumnShapeStatement['openapi'],
          },
        ],
      }),
    )

    expect(error.message).toContain('UserWithDeclaredShapes')
    expect(error.message).toContain('"jsonbData"')
    expect(error.message).toContain('@deco.JSON')
    expect(error.message).toContain('data/properties/oneOf must be object,boolean')
  })

  it('refuses an object @deco.Virtual shape that cannot be compiled', async () => {
    const error = await bootErrorWith(
      userDeclaring({
        virtualAttributes: [
          ...virtualAttributes(),
          {
            property: 'openapiVirtualSpecTest3',
            type: { type: 'object', properties: { code: { type: 'string', pattern: '\\-' } } },
          },
        ],
      }),
    )

    expect(error.message).toContain('UserWithDeclaredShapes')
    expect(error.message).toContain('"openapiVirtualSpecTest3"')
    expect(error.message).toContain('@deco.Virtual')
  })

  it('names @deco.Encrypted for an encrypted attribute', async () => {
    const error = await bootErrorWith(
      userDeclaring({
        virtualAttributes: [
          ...virtualAttributes().filter(statement => statement.property !== 'secret'),
          {
            property: 'secret',
            type: {
              type: 'object',
              properties: { v: { type: ['string', 'number'] } },
            } as unknown as VirtualAttributeStatement['type'],
          },
        ],
      }),
    )

    expect(error.message).toContain('"secret"')
    expect(error.message).toContain('@deco.Encrypted')
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
