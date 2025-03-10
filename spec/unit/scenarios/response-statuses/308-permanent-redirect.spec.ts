import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 308', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 308', async () => {
    const res = await request.get('/permanent-redirect', 308)
    expect(res.header.location).toEqual('/chalupas')
  })
})
