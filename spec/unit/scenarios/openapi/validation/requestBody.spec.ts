import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import OpenapiEndpointRenderer from '../../../../../src/openapi-renderer/endpoint.js'
import { PsychicApp, PsychicServer } from '../../../../../src/package-exports/index.js'
import Pet from '../../../../../test-app/src/app/models/Pet.js'
import User from '../../../../../test-app/src/app/models/User.js'

describe('openapi validation', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('requestBody', () => {
    context('with validation active on this openapi endpoint', () => {
      beforeEach(() => {
        // stubbing psychicApp to ensure that it does not produce a false positive
        vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)

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

      context('with custom schema being rendered', () => {
        it('validates the request', async () => {
          await request.post('/requestBodyboilerplateSchemaTest', 204, {
            data: { myField: 'hi' },
          })
          await request.post('/requestBodyboilerplateSchemaTest', 400, {
            data: { myField: [true] },
          })
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
          expect(res.body).toEqual({})
        })
      })

      context('with missing required fields', () => {
        it('denies the request', async () => {
          const res = await request.post('/requestBodyOpenapiTest', 400)
          expect(res.body).toEqual({})
        })
      })

      context('with missing non-required fields', () => {
        it('permits the request', async () => {
          await request.post('/requestBodyOpenapiTest', 204, {
            data: {
              requiredInt: 123,
            },
          })
        })
      })

      context('with null for a nullable enum array column', () => {
        it('clears the column', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({
            user,
            species: 'cat',
            nonNullSpecies: 'cat',
            favoriteTreats: ['efishy feesh'],
            nonNullFavoriteTreats: ['efishy feesh'],
            name: 'aster',
          })

          await request.patch(`/pets/${pet.id}`, 204, { data: { favoriteTreats: null } })

          await pet.reload()
          expect(pet.favoriteTreats).toBeNull()
        })
      })

      context('status response in BeforeAction', () => {
        it('does not validate params against OpenAPI spec', async () => {
          await request.post('/beforeAction403', 403, {
            data: {
              stringParam: 7,
            },
          })
        })
      })

      context('accesses params in BeforeAction', () => {
        it('validates params against OpenAPI spec', async () => {
          await request.post('/beforeActionParamsAccessed', 400, {
            data: {
              stringParam: 7,
            },
          })
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
            await request.post('/pets', 400, {
              data: {
                name: ['abc'],
                species: 'cat',
                nonNullSpecies: 'cat',
                nonNullFavoriteTreats: [],
                userId: user.id,
              },
            })
          })
        })

        context('with invalid nested requestBody fields', () => {
          it('denies the request', async () => {
            await request.post('/requestBodyNestedObjectOpenapiTest', 400, {
              data: {
                nested: {
                  object: {
                    requiredInt: ['abc'],
                  },
                },
              },
            })
          })
        })

        context('with missing required fields', () => {
          it('denies the request', async () => {
            await request.post('/requestBodyOpenapiTest', 400)
          })
        })

        context('with missing nested required fields', () => {
          it('denies the request', async () => {
            await request.post('/requestBodyNestedObjectOpenapiTest', 400, {
              data: {
                nested: {
                  object: {
                    optionalInt: 123,
                  },
                },
              },
            })
          })
        })

        context('with missing non-required fields', () => {
          it('permits the request', async () => {
            await request.post('/requestBodyOpenapiTest', 204, {
              data: {
                requiredInt: 123,
              },
            })
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
            await request.post('/invalidRequestBody', 200, {
              data: {
                numericParam: 'hello world',
              },
            })
          })
        })

        context('with missing required fields', () => {
          it('permits the request', async () => {
            await request.post('/requestBodyOpenapiTest', 204)
          })
        })

        context('with missing non-required fields', () => {
          it('permits the request', async () => {
            await request.post('/requestBodyOpenapiTest', 204, {
              data: {
                requiredInt: 123,
              },
            })
          })
        })

        // With request-body validation off, nothing upstream rejects a null
        // element, so paramsFor's own check is what keeps it out.
        context('with a null element in a nullable enum array column', () => {
          it('denies the request and leaves the column unchanged', async () => {
            const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            const pet = await Pet.create({
              user,
              species: 'cat',
              nonNullSpecies: 'cat',
              favoriteTreats: ['efishy feesh'],
              nonNullFavoriteTreats: ['efishy feesh'],
              name: 'aster',
            })

            await request.patch(`/pets/${pet.id}`, 400, { data: { favoriteTreats: [null] } })

            await pet.reload()
            expect(pet.favoriteTreats).toEqual(['efishy feesh'])
          })
        })
      })
    })
  })
})
