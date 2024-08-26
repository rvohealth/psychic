import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route at a nested resource', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('accepts the request', async () => {
    await request.get('/api/v1/users', 200)
  })
})
