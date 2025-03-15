import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will respond with a 301', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 301', async () => {
    const res = await request.get('/moved-permanently', 301)
    expect(res.header.location).toEqual('/chalupas')
  })
})
