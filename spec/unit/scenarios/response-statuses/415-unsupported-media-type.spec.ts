import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will trigger a 415', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 415', async () => {
    const res = await request.get('/unsupported-media-type', 415)
    expect(res.body).toEqual('custom message')
  })
})
