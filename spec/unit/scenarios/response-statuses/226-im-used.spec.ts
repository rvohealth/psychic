import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 226', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 226', async () => {
    await request.get('/im-used', 226)
  })
})
