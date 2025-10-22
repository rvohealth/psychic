import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/package-exports/index.js'

describe('a visitor attempts to hit a route that will trigger a 403', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 403', async () => {
    const res = await request.get('/forbidden', 403)
    expect(res.body).toEqual('custom message')
  })
})
