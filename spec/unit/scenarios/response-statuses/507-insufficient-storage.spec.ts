import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 507', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 507', async () => {
    const res = await request.get('/insufficient-storage', 507)
    expect(res.body).toEqual('custom message')
  })
})
