import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit an authed route (while being unauthenticated)', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 401', async () => {
    await request.get('/auth-ping', 401)
  })
})
