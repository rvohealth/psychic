import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 208', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 208', async () => {
    await request.get('/already-reported', 208)
  })
})
