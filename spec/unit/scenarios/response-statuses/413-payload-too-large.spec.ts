import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 413', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 413', async () => {
    const res = await request.get('/payload-too-large', 413)
    expect(res.body).toEqual('custom message')
  })
})
