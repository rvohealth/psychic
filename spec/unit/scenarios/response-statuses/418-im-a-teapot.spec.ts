import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('a visitor attempts to hit a route that will trigger a 418', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 418', async () => {
    const res = await request.get('/im-a-teapot', 418)
    expect(res.body).toEqual('custom message')
  })
})
