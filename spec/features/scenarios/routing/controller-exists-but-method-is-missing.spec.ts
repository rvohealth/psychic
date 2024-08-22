import request from '../../../../spec-helpers/spec-request'

describe('a visitor attempts to hit a route where the controller exists, but the method on the controller does not', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('returns 501', async () => {
    await request.get('/controller-exists-but-method-doesnt', 501)
  })
})
