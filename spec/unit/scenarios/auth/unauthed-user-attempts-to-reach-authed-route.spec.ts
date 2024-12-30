import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit an authed route (while being unauthenticated)', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 401', async () => {
    await request.get('/auth-ping', 401)
  })
})
