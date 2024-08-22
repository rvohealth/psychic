import request from '../../../../spec-helpers/spec-request'

describe('a visitor attempts to hit a route that will trigger a 409', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 409', async () => {
    await request.get('/conflict', 409)
  })
})
