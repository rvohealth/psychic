import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a non-existent route', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 404', async () => {
    await request.get('/non-existent-route', 404)
  })
})
