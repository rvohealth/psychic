import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that exists, but is missing a matching controller', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 501', async () => {
    await request.get('/route-exists-but-controller-doesnt', 501)
  })
})
