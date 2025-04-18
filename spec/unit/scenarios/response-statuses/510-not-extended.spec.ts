import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will trigger a 510', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 510', async () => {
    const res = await request.get('/not-extended', 510)
    expect(res.body).toEqual('custom message')
  })
})
