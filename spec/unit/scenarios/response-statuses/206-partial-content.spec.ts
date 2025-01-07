import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 206', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 206', async () => {
    await request.get('/partial-content', 206)
  })
})
