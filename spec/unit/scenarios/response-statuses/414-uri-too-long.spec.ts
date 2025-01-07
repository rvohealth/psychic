import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 414', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 414', async () => {
    const res = await request.get('/uri-too-long', 414)
    expect(res.body).toEqual('custom message')
  })
})
