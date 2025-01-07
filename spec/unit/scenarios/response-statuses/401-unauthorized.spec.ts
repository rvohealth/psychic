import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'

describe('a visitor attempts to hit a route that will trigger a 401', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 401', async () => {
    const res = await request.get('/unauthorized', 401)
    expect(res.body).toEqual('custom message')
  })
})
