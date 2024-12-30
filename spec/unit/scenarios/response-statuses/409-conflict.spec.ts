import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 409', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 409', async () => {
    await request.get('/conflict', 409)
  })
})
