import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/package-exports/index.js'

describe('a visitor attempts to hit a route that will trigger a 412', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 412', async () => {
    const res = await request.get('/precondition-failed', 412)
    expect(res.body).toEqual('custom message')
  })
})
