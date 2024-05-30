import { specRequest as request } from '../../../../spec-helpers'

describe('a visitor attempts to hit a non-existent route', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 404', async () => {
    await request.get('/non-existent-route', 404)
  })
})
