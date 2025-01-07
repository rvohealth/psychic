import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 301', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 301', async () => {
    await request.get('/moved-permanently', 301)
  })
})
