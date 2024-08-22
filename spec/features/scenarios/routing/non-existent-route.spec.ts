import request from '../../../../spec-helpers/spec-request'

describe('a visitor attempts to hit a non-existent route', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 404', async () => {
    await request.get('/non-existent-route', 404)
  })
})
