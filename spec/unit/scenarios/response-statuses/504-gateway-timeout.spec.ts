import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 504', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 504', async () => {
    const res = await request.get('/gateway-timeout', 504)
    expect(res.body).toEqual('custom message')
  })
})
