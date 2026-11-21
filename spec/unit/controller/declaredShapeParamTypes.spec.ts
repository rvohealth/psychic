import { DreamColumn } from '@rvoh/dream/types'
import PsychicController from '../../../src/controller/index.js'
import Params from '../../../src/server/params.js'
import User from '../../../test-app/src/app/models/User.js'
import { createMockKoaContext } from './helpers/mockRequest.js'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T

// the shapes declared on User with @deco.JSON and @deco.Encrypted, as sync
// writes them into the test-app's types
type JsonbData = { theme?: 'light' | 'dark'; fontSize?: number; [key: string]: unknown }
type FavoriteJsonb = { label: string; score?: number; [key: string]: unknown }
type SecretDetails = { pin: string; tier?: 'basic' | 'gold'; [key: string]: unknown } | null

function controller() {
  return new PsychicController(createMockKoaContext({ body: {} }), { action: 'hello' })
}

// The specs marked it.skip are compiled by build:test-app, but not run: each
// Expect fails the build when its types differ, and each line marked as an
// expected error fails the build if it compiles.
describe('param types generated from declared shapes', () => {
  it.skip('types a model property from its declared shape, with no hand-written type', () => {
    type _jsonbData = Expect<Equal<DreamColumn<User, 'requiredJsonbData'>, JsonbData>>
    type _favoriteJsonbs = Expect<Equal<DreamColumn<User, 'requiredFavoriteJsonbs'>, FavoriteJsonb[]>>
    type _secretDetails = Expect<Equal<DreamColumn<User, 'secretDetails'>, SecretDetails>>
    // a bare @deco.Encrypted() is a string, nullable with its backing column
    type _secret = Expect<Equal<DreamColumn<User, 'secret'>, string | null>>

    void (null as unknown as [_jsonbData, _favoriteJsonbs, _secretDetails, _secret])
  })

  it.skip('paramsFor returns the declared shape of a @deco.JSON column and a @deco.Encrypted property', () => {
    const params = controller().paramsFor(User, {
      only: ['requiredJsonbData', 'requiredFavoriteJsonbs', 'secretDetails', 'secret'],
    })

    type _jsonbData = Expect<Equal<typeof params.requiredJsonbData, JsonbData | undefined>>
    type _favoriteJsonbs = Expect<Equal<typeof params.requiredFavoriteJsonbs, FavoriteJsonb[] | undefined>>
    type _secretDetails = Expect<Equal<typeof params.secretDetails, SecretDetails | undefined>>
    type _secret = Expect<Equal<typeof params.secret, string | null | undefined>>

    // @ts-expect-error theme is 'light' or 'dark'
    const theme: typeof params.requiredJsonbData = { theme: 'blue' }
    // @ts-expect-error pin is required
    const details: typeof params.secretDetails = { tier: 'gold' }

    void (null as unknown as [_jsonbData, _favoriteJsonbs, _secretDetails, _secret])
    void [params, theme, details]
  })

  it.skip('extractParams returns the declared shape of a @deco.JSON column and a @deco.Encrypted property', () => {
    const params = controller().extractParams(User, [
      'requiredJsonbData',
      'requiredFavoriteJsonbs',
      'secretDetails',
    ])
    const many = controller().extractParams(User, ['requiredJsonbData', 'secretDetails'], {
      key: 'users',
      array: true,
    })

    type _jsonbData = Expect<Equal<typeof params.requiredJsonbData, JsonbData | undefined>>
    type _favoriteJsonbs = Expect<Equal<typeof params.requiredFavoriteJsonbs, FavoriteJsonb[] | undefined>>
    type _secretDetails = Expect<Equal<typeof params.secretDetails, SecretDetails | undefined>>
    type _many = Expect<
      Equal<(typeof many)[number], { requiredJsonbData?: JsonbData; secretDetails?: SecretDetails }>
    >

    void (null as unknown as [_jsonbData, _favoriteJsonbs, _secretDetails, _many])
    void [params, many]
  })

  it.skip('Params.for and Params.extract return the same types', () => {
    const forParams = Params.for({}, User, { only: ['requiredJsonbData', 'secretDetails'] })
    const extracted = Params.extract({}, User, ['requiredJsonbData', 'secretDetails'])

    type _for = Expect<
      Equal<typeof forParams, { requiredJsonbData?: JsonbData; secretDetails?: SecretDetails }>
    >
    type _extract = Expect<
      Equal<typeof extracted, { requiredJsonbData?: JsonbData; secretDetails?: SecretDetails }>
    >

    void (null as unknown as [_for, _extract])
    void [forParams, extracted]
  })

  it.skip('lets the result of paramsFor be saved as it is', async () => {
    const params = controller().paramsFor(User, { only: ['requiredJsonbData', 'secretDetails'] })
    await User.create({ email: 'how@yadoin', ...params })
    await User.new().update(params)
  })
})
