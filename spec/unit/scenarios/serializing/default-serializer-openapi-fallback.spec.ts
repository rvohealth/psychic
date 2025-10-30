import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/package-exports/index.js'
import Pet from '../../../../test-app/src/app/models/Pet.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('openapi fallback', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
    await Pet.create({
      user,
      species: 'cat',
      nonNullSpecies: 'cat',
      nonNullFavoriteTreats: ['efishy feesh'],
      name: 'chalupa gooding jr',
    })
  })

  it('falls back to the openapi serializer when no serializer key is explicitly provided', async () => {
    await request.get('/serializer-fallbacks/uses-openapi-serializer', 200)
  })

  context('with a serializer key set on the openapi definition', () => {
    it('respects serializerKey', async () => {
      const res = await request.get('/serializer-fallbacks/uses-openapi-serializer-with-serializer-key', 200)
      expect((res.body as { nickname: string }).nickname).toEqual('nickchalupa gooding jr')
    })
  })

  context('when being passed something that is already serialized', () => {
    it('does not double-serialize', async () => {
      await request.get('/serializer-fallbacks/doesnt-use-openapi-serializer', 200)
    })
  })

  context('when a serializerKey is explicitly provided', () => {
    it('uses the explicit serializerKey', async () => {
      const res = await request.get('/serializer-fallbacks/overrides-openapi-serializer', 200)
      expect((res.body as { nickname: string }).nickname).toEqual('nickchalupa gooding jr')
    })
  })
})
