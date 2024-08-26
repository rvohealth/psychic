import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route where the controller exists, but the method on the controller does not', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 501', async () => {
    await request.get('/controller-exists-but-method-doesnt', 501)
  })
})
