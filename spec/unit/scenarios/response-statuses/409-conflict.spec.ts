import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will trigger a 409', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 409', async () => {
    await request.get('/conflict', 409)
  })
})
