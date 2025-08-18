import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicApp, PsychicServer } from '../../../../../src/index.js'
import OpenapiEndpointRenderer from '../../../../../src/openapi-renderer/endpoint.js'

describe('openapi validation', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('responseBody', () => {
    context('with validation active on this openapi endpoint', () => {
      beforeEach(() => {
        // stubbing psychicApp to ensure that it does not produce a false positive
        vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)

        vi.spyOn(OpenapiEndpointRenderer.prototype, 'shouldValidateResponseBody').mockReturnValue(true)
      })

      context('with a valid response body', () => {
        it('permits the request', async () => {
          const res = await request.get('/responseBodyOpenapiTest', 200, {
            query: {
              renderMe: '123',
            },
          })
          expect(res.body).toEqual(123)
        })
      })

      context('with custom schema being rendered', () => {
        it('permits the request', async () => {
          const res = await request.get('/responseBodyboilerplateSchemaTest', 200)
          expect(res.body).toEqual({ myField: 'hello world' })
        })
      })

      context('with an invalid response body', () => {
        it('rejects the request', async () => {
          await request.get('/responseBodyOpenapiTest', 500, {
            query: {
              renderMe: ['hello'],
            },
          })
        })

        context('with an invalid, null response body', () => {
          it('rejects the request', async () => {
            await request.get('/responseBodyOpenapiTest', 500, {
              query: {
                renderMe: null,
              },
            })
          })
        })

        context('with an invalid, null response body', () => {
          it('rejects the request', async () => {
            await request.get('/responseBodyOpenapiTest', 500, {
              query: {
                renderMe: undefined,
              },
            })
          })
        })
      })

      context('with missing required fields', () => {
        it('denies the request', async () => {
          await request.get('/responseBodyObjectOpenapiTest', 500, {
            query: {
              optionalInt: 123,
            },
          })
        })
      })

      context('with missing nested required fields', () => {
        it('denies the request', async () => {
          await request.get('/responseBodyNestedObjectOpenapiTest', 500, {
            query: {
              optionalInt: 123,
            },
          })
        })
      })

      context('with missing non-required fields', () => {
        it('permits the request', async () => {
          await request.get('/responseBodyObjectOpenapiTest', 200, {
            query: {
              requiredInt: 123,
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

        context('with a valid response body', () => {
          it('permits the request', async () => {
            await request.get('/responseBodyOpenapiTest', 200, {
              query: {
                renderMe: 123,
              },
            })
          })
        })

        context('with an invalid response body', () => {
          it('rejects the request', async () => {
            await request.get('/responseBodyOpenapiTest', 500, {
              query: {
                renderMe: 'hello',
              },
            })
          })
        })

        context('with missing required fields', () => {
          it('denies the request', async () => {
            await request.get('/responseBodyObjectOpenapiTest', 500, {
              query: {
                optionalInt: 123,
              },
            })
          })
        })

        context('with missing non-required fields', () => {
          it('permits the request', async () => {
            await request.get('/responseBodyObjectOpenapiTest', 200, {
              query: {
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

        context('with a valid response body', () => {
          it('permits the request', async () => {
            await request.get('/responseBodyOpenapiTest', 200, {
              query: {
                renderMe: 123,
              },
            })
          })
        })

        context('with an invalid response body', () => {
          it('permits the request', async () => {
            await request.get('/responseBodyOpenapiTest', 200, {
              query: {
                renderMe: 'hello',
              },
            })
          })
        })

        context('with missing required fields', () => {
          it('permits the request', async () => {
            await request.get('/responseBodyObjectOpenapiTest', 200, {
              query: {
                optionalInt: 123,
              },
            })
          })
        })

        context('with missing non-required fields', () => {
          it('permits the request', async () => {
            await request.get('/responseBodyObjectOpenapiTest', 200, {
              query: {
                requiredInt: 123,
              },
            })
          })
        })
      })
    })

    context('when the model does not have a serializers getter, but the status is 204', () => {
      it('does not throw an eror', async () => {
        await request.post('/dontThrowMissingSerializersDefinition204', 204)
      })
    })

    context('when the model does not have a serializers getter, but the status is 204', () => {
      it('does not throw an eror', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const body = (await request.post('/dontThrowMissingSerializersDefinition201', 201)).body
        expect(body).toEqual('12345')
      })
    })
  })
})
