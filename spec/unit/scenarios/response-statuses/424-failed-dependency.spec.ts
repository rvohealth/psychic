import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will trigger a 424', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 424', async () => {
    const res = await request.get('/failed-dependency', 424)
    expect(res.body).toEqual('custom message')
  })
})
