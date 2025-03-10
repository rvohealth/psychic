import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 500', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 500', async () => {
    await request.get('/internal-server-error', 500)
  })
})
