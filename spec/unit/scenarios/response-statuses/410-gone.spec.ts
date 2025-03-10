import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 410', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 410', async () => {
    const res = await request.get('/gone', 410)
    expect(res.body).toEqual('custom message')
  })
})
