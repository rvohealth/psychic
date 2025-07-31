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
        vi.spyOn(OpenapiEndpointRenderer.prototype, 'shouldValidateQuery').mockReturnValue(true)
      })

      context('with a valid query', () => {
        it('permits the request', async () => {
          await request.get('/pets/queryOpenapiTest', 200, {
            query: {
              numericParam: 123,
            },
          })
        })
      })

      context('with an invalid query', () => {
        it('rejects the request', async () => {
          await request.get('/pets/queryOpenapiTest', 400, {
            query: {
              numericParam: ['hello'],
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

        context('with a valid query', () => {
          it('permits the request', async () => {
            await request.get('/pets/queryOpenapiTest', 200, {
              query: {
                numericParam: 123,
              },
            })
          })
        })

        context('with an invalid query', () => {
          it('rejects the request', async () => {
            await request.get('/pets/queryOpenapiTest', 400, {
              query: {
                numericParam: 'hello',
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
            await request.get('/pets/queryOpenapiTest', 200, {
              query: {
                numericParam: 123,
              },
            })
          })
        })

        context('with an invalid query', () => {
          it('permits the request', async () => {
            await request.get('/pets/queryOpenapiTest', 200, {
              query: {
                numericParam: 'hello',
              },
            })
          })
        })
      })
    })
  })
})
