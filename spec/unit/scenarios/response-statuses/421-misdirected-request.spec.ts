import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/package-exports/index.js'

describe('a visitor attempts to hit a route that will trigger a 421', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 421', async () => {
    const res = await request.get('/misdirected-request', 421)
    expect(res.body).toEqual('custom message')
  })
})
