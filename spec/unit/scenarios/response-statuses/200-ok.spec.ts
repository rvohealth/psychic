import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src.js'

describe('a visitor attempts to hit a route that will respond with a 200', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 200', async () => {
    const res = await request.get('/ok', 200)
    expect(res.body).toEqual('custom content')
  })
})
