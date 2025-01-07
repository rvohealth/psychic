import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 303', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 303', async () => {
    await request.get('/see-other', 303)
  })
})
