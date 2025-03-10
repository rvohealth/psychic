import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will respond with a 303', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 303', async () => {
    const res = await request.get('/see-other', 303)
    expect(res.header.location).toEqual('/chalupas')
  })
})
