import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/package-exports/index.js'

describe('a visitor attempts to hit a route that will respond with a 302', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 302', async () => {
    const res = await request.get('/found', 302)
    expect(res.header.location).toEqual('/chalupas')
  })
})
