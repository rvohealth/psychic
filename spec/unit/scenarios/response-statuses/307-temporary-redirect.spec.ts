import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will respond with a 307', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 307', async () => {
    const res = await request.get('/temporary-redirect', 307)
    expect(res.header.location).toEqual('/chalupas')
  })
})
