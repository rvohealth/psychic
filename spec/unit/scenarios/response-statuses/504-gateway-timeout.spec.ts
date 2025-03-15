import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will trigger a 504', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 504', async () => {
    const res = await request.get('/gateway-timeout', 504)
    expect(res.body).toEqual('custom message')
  })
})
