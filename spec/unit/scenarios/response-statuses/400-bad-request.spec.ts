import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 400', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 400', async () => {
    await request.get('/bad-request', 400)
  })
})
