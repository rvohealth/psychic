import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will respond with a 202', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 202', async () => {
    const res = await request.get('/accepted', 202)
    expect(res.body).toEqual('custom content')
  })
})
