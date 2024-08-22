import request from '../../../../spec-helpers/spec-request'

describe('a visitor attempts to hit a route at a nested resource', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('accepts the request', async () => {
    await request.get('/api/v1/users', 200)
  })
})
