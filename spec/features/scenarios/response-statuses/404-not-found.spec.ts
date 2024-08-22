import request from '../../../../spec-helpers/spec-request'

describe('a visitor attempts to hit a route that will trigger a 404', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 404', async () => {
    await request.get('/not-found', 404)
  })
})
