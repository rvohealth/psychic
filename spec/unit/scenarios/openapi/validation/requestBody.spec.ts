import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicApp, PsychicServer } from '../../../../../src/index.js'
import User from '../../../../../test-app/src/app/models/User.js'
import OpenapiEndpointRenderer from '../../../../../src/openapi-renderer/endpoint.js'

describe('openapi validation', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('requestBody', () => {
    context('with validation active on this openapi endpoint', () => {
      beforeEach(() => {
        vi.spyOn(OpenapiEndpointRenderer.prototype, 'shouldValidateRequestBody').mockReturnValue(true)
      })

      context('with a valid requestBody', () => {
        it('permits the request', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          await request.post('/pets', 201, {
            data: {
              name: 'aster',
              species: 'cat',
              nonNullSpecies: 'cat',
              nonNullFavoriteTreats: [],
              userId: user.id,
            },
          })

          const aster = await user.associationQuery('pets').firstOrFail()
          expect(aster.name).toEqual('aster')
        })
      })

      context('with an invalid requestBody', () => {
        it('denies the request', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const res = await request.post('/pets', 400, {
            data: {
              name: ['abc'],
              species: 'cat',
              nonNullSpecies: 'cat',
              nonNullFavoriteTreats: [],
              userId: user.id,
            },
          })
          expect(res.body).toEqual({ errors: { name: ['must be string,null'] } })
        })
      })
    })

    context('without validation active on this openapi endpoint', () => {
      context('with validation active on the PsychicApp', () => {
        beforeEach(() => {
          vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(true)
        })

        context('with a valid requestBody', () => {
          it('permits the request', async () => {
            const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            await request.post('/pets', 201, {
              data: {
                name: 'aster',
                species: 'cat',
                nonNullSpecies: 'cat',
                nonNullFavoriteTreats: [],
                userId: user.id,
              },
            })

            const aster = await user.associationQuery('pets').firstOrFail()
            expect(aster.name).toEqual('aster')
          })
        })

        context('with an invalid requestBody', () => {
          it('denies the request', async () => {
            const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            const res = await request.post('/pets', 400, {
              data: {
                name: ['abc'],
                species: 'cat',
                nonNullSpecies: 'cat',
                nonNullFavoriteTreats: [],
                userId: user.id,
              },
            })
            expect(res.body).toEqual({ errors: { name: ['must be string,null'] } })
          })
        })
      })

      context('without validation active on the PsychicApp', () => {
        beforeEach(() => {
          vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)
        })

        context('with a valid requestBody', () => {
          it('permits the request', async () => {
            const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            await request.post('/pets', 201, {
              data: {
                name: 'aster',
                species: 'cat',
                nonNullSpecies: 'cat',
                nonNullFavoriteTreats: [],
                userId: user.id,
              },
            })

            const aster = await user.associationQuery('pets').firstOrFail()
            expect(aster.name).toEqual('aster')
          })
        })

        context('with an invalid requestBody', () => {
          it('permits the request', async () => {
            await request.post('/pets/invalidRequestBody', 200, {
              data: {
                numericParam: 'hello world',
              },
            })
          })
        })
      })
    })
  })
})
