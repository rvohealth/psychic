import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 404', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 404', async () => {
    await request.get('/not-found', 404)
  })
})
