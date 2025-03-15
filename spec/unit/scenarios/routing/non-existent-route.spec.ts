import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a non-existent route', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 404', async () => {
    await request.get('/non-existent-route', 404)
  })
})
