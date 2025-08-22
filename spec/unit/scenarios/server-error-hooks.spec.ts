import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src/index.js'

describe('server error hooks', () => {
  beforeEach(async () => {
    process.env.FORCE_THROW_DURING_SERVER_ERROR = '1'
    await request.init(PsychicServer)
  })

  afterEach(() => {
    process.env.FORCE_THROW_DURING_SERVER_ERROR = undefined
  })

  context('status codes to handle', () => {
    context('random error', () => {
      it('calls user-defined serverError hooks', async () => {
        await request.get('/server-errors/unexpected-error', 418)
      })

      context('when the serverError handler throws the original error', () => {
        it('continues to process the error as usual', async () => {
          process.env.FORCE_THROW_DURING_SERVER_ERROR = undefined
          await request.get('/server-errors/unexpected-error', 500)
        })
      })
    })

    context('openapi failure (400)', () => {
      it('calls user-defined serverError hooks', async () => {
        await request.get('/server-errors/openapi-error', 418)
      })

      context('when the serverError handler throws the original error', () => {
        it('continues to process the error as usual', async () => {
          process.env.FORCE_THROW_DURING_SERVER_ERROR = undefined
          await request.get('/server-errors/openapi-error', 400)
        })
      })
    })
  })

  context('ignorable status codes', () => {
    context('400', () => {
      it('does not call serverError hooks', async () => {
        await request.get('/server-errors/bad-request', 400)
      })
    })

    context('401', () => {
      it('does not call serverError hooks', async () => {
        await request.get('/server-errors/unauthorized-error', 401)
      })
    })

    context('403', () => {
      it('does not call serverError hooks', async () => {
        await request.get('/server-errors/forbidden-error', 403)
      })
    })

    context('404', () => {
      it('does not call serverError hooks', async () => {
        await request.get('/server-errors/not-found-error', 404)
      })
    })

    context('RecordNotFound (404)', () => {
      it('does not call serverError hooks', async () => {
        await request.get('/server-errors/record-not-found-error', 404)
      })
    })
  })
})
