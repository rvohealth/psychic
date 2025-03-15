import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will respond with a 204', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 204', async () => {
    await request.get('/no-content', 204)
  })
})
