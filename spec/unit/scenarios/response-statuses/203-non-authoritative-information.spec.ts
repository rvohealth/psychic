import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will respond with a 203', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 203', async () => {
    const res = await request.get('/non-authoritative-information', 203)
    expect(res.body).toEqual('custom content')
  })
})
