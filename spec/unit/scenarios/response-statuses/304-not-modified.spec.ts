import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 304', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 304', async () => {
    await request.get('/not-modified', 304)
  })
})
