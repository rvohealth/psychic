import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 205', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 205', async () => {
    await request.get('/reset-content', 205)
  })
})
