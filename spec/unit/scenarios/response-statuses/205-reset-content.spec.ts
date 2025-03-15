import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will respond with a 205', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 205', async () => {
    await request.get('/reset-content', 205)
  })
})
