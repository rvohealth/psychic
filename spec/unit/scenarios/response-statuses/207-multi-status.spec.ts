import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 207', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 207', async () => {
    await request.get('/multi-status', 207)
  })
})
