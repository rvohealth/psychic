import request from '../../../../spec-helpers/spec-request'

describe('a visitor attempts to hit an authed route (while being unauthenticated)', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 401', async () => {
    await request.get('/auth-ping', 401)
  })
})
