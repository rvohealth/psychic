import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicApp, PsychicServer } from '../../../../../src/index.js'
import OpenapiEndpointRenderer from '../../../../../src/openapi-renderer/endpoint.js'

describe('openapi validation', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('headers', () => {
    context('with validation active on this openapi endpoint', () => {
      beforeEach(() => {
        // stubbing psychicApp to ensure that it does not produce a false positive
        vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)

        vi.spyOn(OpenapiEndpointRenderer.prototype, 'shouldValidateHeaders').mockReturnValue(true)
      })

      context('with valid headers', () => {
        it('permits the request', async () => {
          const res = await request.get('/headersOpenapiTest', 200, {
            headers: {
              myDate: '2020-01-01',
              myOptionalDate: '2020-01-01',
              myOptionalInt: '123.0',
            },
          })
          expect(res.body).toEqual({
            myDate: '2020-01-01',
            myOptionalDate: '2020-01-01',
            myOptionalInt: '123.0',
          })
        })
      })

      context('with invalid headers', () => {
        it('denies the request', async () => {
          vi.spyOn(PsychicApp.prototype, 'includeDetailedOpenapiValidationErrors').mockReturnValue(true)

          const res = await request.get('/headersOpenapiTest', 400, {
            headers: {
              myDate: '2020-01-ABC',
              myOptionalDate: '2020-01-ABC',
              myOptionalInt: '123.01',
            },
          })
          expect(res.body).toEqual({
            type: 'openapi',
            target: 'headers',
            errors: [
              {
                instancePath: '/myDate',
                schemaPath: '#/properties/myDate/format',
                keyword: 'format',
                message: 'must match format "date"',
                params: { format: 'date' },
              },
              {
                instancePath: '/myOptionalDate',
                schemaPath: '#/properties/myOptionalDate/format',
                keyword: 'format',
                message: 'must match format "date"',
                params: { format: 'date' },
              },
              {
                instancePath: '/myOptionalInt',
                schemaPath: '#/properties/myOptionalInt/type',
                keyword: 'type',
                message: 'must be integer',
                params: { type: 'integer' },
              },
            ],
          })
        })
      })

      context('with missing required headers', () => {
        it('denies the request', async () => {
          vi.spyOn(PsychicApp.prototype, 'includeDetailedOpenapiValidationErrors').mockReturnValue(true)

          const res = await request.get('/headersOpenapiTest', 400)
          expect(res.body).toEqual({
            type: 'openapi',
            target: 'headers',
            errors: [
              {
                instancePath: '',
                schemaPath: '#/required',
                keyword: 'required',
                message: "must have required property 'myDate'",
                params: { missingProperty: 'myDate' },
              },
            ],
          })
        })
      })

      context('with missing non-required headers', () => {
        it('permits the request', async () => {
          await request.get('/headersOpenapiTest', 200, {
            headers: {
              myDate: '2020-01-01',
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

        context('with valid headers', () => {
          it('permits the request', async () => {
            await request.get('/headersOpenapiTest', 200, {
              headers: {
                myDate: '2020-01-01',
              },
            })
          })
        })

        context('with invalid headers', () => {
          it('denies the request', async () => {
            await request.get('/headersOpenapiTest', 400, {
              headers: {
                myDate: '2020-01-ABC',
              },
            })
          })
        })

        context('with missing required headers', () => {
          it('denies the request', async () => {
            await request.get('/headersOpenapiTest', 400)
          })
        })

        context('with missing non-required headers', () => {
          it('permits the request', async () => {
            await request.get('/headersOpenapiTest', 200, {
              headers: {
                myDate: '2020-01-01',
              },
            })
          })
        })
      })

      context('without validation active on the PsychicApp', () => {
        beforeEach(() => {
          vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)
        })

        context('with valid headers', () => {
          it('permits the request', async () => {
            await request.get('/headersOpenapiTest', 200, {
              headers: {
                myDate: '2020-01-01',
              },
            })
          })
        })

        context('with invalid headers', () => {
          it('permits the request', async () => {
            await request.get('/headersOpenapiTest', 200, {
              headers: {
                myDate: '2020-01-ABC',
              },
            })
          })
        })

        context('with missing required headers', () => {
          it('permits the request', async () => {
            await request.get('/headersOpenapiTest', 200)
          })
        })

        context('with missing non-required headers', () => {
          it('permits the request', async () => {
            await request.get('/headersOpenapiTest', 200)
          })
        })
      })
    })
  })
})
