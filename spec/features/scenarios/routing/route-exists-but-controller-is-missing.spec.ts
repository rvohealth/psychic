import { specRequest as request } from '../../../../spec-helpers'

describe('a visitor attempts to hit a route that exists, but is missing a matching controller', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 501', async () => {
    await request.get('/route-exists-but-controller-doesnt', 501)
  })
})
