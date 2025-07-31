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
        vi.spyOn(OpenapiEndpointRenderer.prototype, 'shouldValidateResponseBody').mockReturnValue(true)
      })

      context('with a valid response body', () => {
        it('permits the request', async () => {
          await request.get('/pets/responseBodyOpenapiTest', 200, {
            query: {
              renderMe: '123',
            },
          })
        })
      })

      context('with an invalid response body', () => {
        it('rejects the request', async () => {
          await request.get('/pets/responseBodyOpenapiTest', 400, {
            query: {
              renderMe: ['hello'],
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
            await request.get('/pets/responseBodyOpenapiTest', 200, {
              query: {
                renderMe: 123,
              },
            })
          })
        })

        context('with an invalid response body', () => {
          it('rejects the request', async () => {
            await request.get('/pets/responseBodyOpenapiTest', 400, {
              query: {
                renderMe: 'hello',
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
            await request.get('/pets/responseBodyOpenapiTest', 200, {
              query: {
                renderMe: 123,
              },
            })
          })
        })

        context('with an invalid response body', () => {
          it('permits the request', async () => {
            await request.get('/pets/responseBodyOpenapiTest', 200, {
              query: {
                renderMe: 'hello',
              },
            })
          })
        })
      })
    })
  })
})
