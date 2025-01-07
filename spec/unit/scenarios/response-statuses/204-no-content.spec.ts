import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 204', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 204', async () => {
    await request.get('/no-content', 204)
  })
})
