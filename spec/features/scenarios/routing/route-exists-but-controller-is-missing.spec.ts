import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit a route that exists, but is missing a matching controller', () => {
  it('returns 501', async () => {
    await send.get('/route-exists-but-controller-doesnt', 501)
  })
})
