import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicApp, PsychicServer } from '../../../../../src/index.js'
import OpenapiEndpointRenderer from '../../../../../src/openapi-renderer/endpoint.js'

describe('openapi validation', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('query', () => {
    context('with validation active on this openapi endpoint', () => {
      beforeEach(() => {
        // stubbing psychicApp to ensure that it does not produce a false positive
        vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)

        vi.spyOn(OpenapiEndpointRenderer.prototype, 'shouldValidateQuery').mockReturnValue(true)
      })

      context('with a valid query', () => {
        it('permits the request', async () => {
          await request.get('/queryOpenapiTest', 200, {
            query: {
              numericParam: 123,
            },
          })
        })
      })

      context('with plausible coercion on the table', () => {
        it('refrains from coercing query params', async () => {
          const res = await request.get('/queryOpenapiTest', 200, {
            query: {
              numericParam: '123',
            },
          })
          expect(res.body).toEqual({ numericParam: '123' })
        })
      })

      context('with an invalid query', () => {
        it('rejects the request', async () => {
          const res = await request.get('/queryOpenapiTest', 400, {
            query: {
              numericParam: ['hello'],
            },
          })
          expect(res.body).toEqual({
            type: 'openapi',
            target: 'query',
            errors: [
              {
                instancePath: '/numericParam',
                schemaPath: '#/properties/numericParam/type',
                keyword: 'type',
                message: 'must be number',
                params: { type: 'number' },
              },
            ],
          })
        })
      })

      context('with missing required query params', () => {
        it('denies the request', async () => {
          const res = await request.get('/queryRequiredOpenapiTest', 400)
          expect(res.body).toEqual({
            type: 'openapi',
            target: 'query',
            errors: [
              {
                instancePath: '',
                schemaPath: '#/required',
                keyword: 'required',
                message: "must have required property 'requiredStringParam'",
                params: { missingProperty: 'requiredStringParam' },
              },
            ],
          })
        })
      })

      context('with missing non-required query params', () => {
        it('permits the request', async () => {
          await request.get('/queryRequiredOpenapiTest', 200, {
            query: {
              requiredStringParam: ['hello'],
            },
          })
        })
      })

      context('array handling', () => {
        context('no array brackets', () => {
          it('can parse single-value array', async () => {
            const res = await request.get('/queryOpenapiTest', 200, {
              query: {
                stringArray: ['hello'],
              },
            })
            expect(res.body).toEqual({
              stringArray: ['hello'],
            })
          })

          it('can parse multi-value array', async () => {
            const res = await request.get('/queryOpenapiTest', 200, {
              query: {
                stringArray: ['hello', 'world'],
              },
            })
            expect(res.body).toEqual({
              stringArray: ['hello', 'world'],
            })
          })

          it('will reject blank values when prompted to', async () => {
            await request.get('/queryRequiredValueTest', 400)
            await request.get('/queryRequiredValueTest', 400, {
              query: {
                stringArray: [],
              },
            })
          })

          it('coerces blank string to a blank array', async () => {
            const res = await request.get('/queryOpenapiTest?stringArray=', 200)
            expect(res.body).toEqual({ stringArray: [] })
          })

          it('missing query params are allowed unless required', async () => {
            const res = await request.get('/queryOpenapiTest', 200)
            expect(res.body).toEqual({})
          })

          it('coerces blank string to a blank array', async () => {
            const res = await request.get('/queryRequiredValueTest', 200, {
              query: {
                stringArray: '',
              },
            })
            expect(res.body).toEqual({ stringArray: [] })
          })

          it('coerces null to a blank array', async () => {
            const res = await request.get('/queryRequiredValueTest', 200, {
              query: {
                stringArray: null,
              },
            })
            expect(res.body).toEqual({ stringArray: [] })
          })
        })

        context('array brackets', () => {
          it('can parse single-value array', async () => {
            const res = await request.get('/queryOpenapiTest', 200, {
              query: {
                'otherStringArray[]': 'hello',
              },
            })
            expect(res.body).toEqual({
              'otherStringArray[]': ['hello'],
            })
          })

          it('rejects unexpected null', async () => {
            await request.get('/queryRequiredValueTest', 400, {
              query: {
                'otherStringArray[]': null,
              },
            })
          })

          it('can parse multi-value array', async () => {
            const res = await request.get('/queryOpenapiTest', 200, {
              query: {
                'otherStringArray[]': ['hello', 'world'],
              },
            })
            expect(res.body).toEqual({
              'otherStringArray[]': ['hello', 'world'],
            })
          })

          it('will reject blank values when prompted to', async () => {
            await request.get('/queryRequiredValueTest', 400, {
              query: {
                'otherStringArray[]': '',
              },
            })
            await request.get('/queryRequiredValueTest', 400, {
              query: {
                'otherStringArray[]': null,
              },
            })
          })
        })
      })
    })

    context('without validation active on this openapi endpoint', () => {
      context('with validation active on the PsychicApp', () => {
        beforeEach(() => {
          vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(true)
        })

        context('with a valid query', () => {
          it('permits the request', async () => {
            await request.get('/queryOpenapiTest', 200, {
              query: {
                numericParam: 123,
              },
            })
          })
        })

        context('with an invalid query', () => {
          it('rejects the request', async () => {
            await request.get('/queryOpenapiTest', 400, {
              query: {
                numericParam: 'hello',
              },
            })
          })
        })

        context('with missing required query params', () => {
          it('denies the request', async () => {
            await request.get('/queryRequiredOpenapiTest', 400)
          })
        })

        context('with missing non-required query params', () => {
          it('permits the request', async () => {
            await request.get('/queryRequiredOpenapiTest', 200, {
              query: {
                requiredStringParam: ['hello'],
              },
            })
          })
        })
      })

      context('without validation active on the PsychicApp', () => {
        beforeEach(() => {
          vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)
        })

        context('with a valid query', () => {
          it('permits the request', async () => {
            await request.get('/queryOpenapiTest', 200, {
              query: {
                numericParam: 123,
              },
            })
          })
        })

        context('with an invalid query', () => {
          it('permits the request', async () => {
            await request.get('/queryOpenapiTest', 200, {
              query: {
                numericParam: 'hello',
              },
            })
          })
        })

        context('with missing required query params', () => {
          it('permits the request', async () => {
            await request.get('/queryRequiredOpenapiTest', 200)
          })
        })

        context('with missing non-required query params', () => {
          it('permits the request', async () => {
            await request.get('/queryRequiredOpenapiTest', 200, {
              query: {
                requiredStringParam: ['hello'],
              },
            })
          })
        })
      })
    })
  })
})
