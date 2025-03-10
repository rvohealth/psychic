import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 501', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 501', async () => {
    const res = await request.get('/not-implemented', 501)
    expect(res.body).toEqual('custom message')
  })
})
