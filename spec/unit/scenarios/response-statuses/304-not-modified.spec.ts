import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/package-exports/index.js'

describe('a visitor attempts to hit a route that will respond with a 304', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 304', async () => {
    const res = await request.get('/ok', 200)

    await request.get('/ok', 304, {
      headers: {
        ['if-none-match']: res.headers.etag!,
      },
    })
  })
})
