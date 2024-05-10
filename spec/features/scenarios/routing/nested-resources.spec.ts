import { send } from '../../../../spec-helpers'

describe('a visitor attempts to hit a route at a nested resource', () => {
  it('accepts the request', async () => {
    await send.get('/api/v1/users', 200)
  })
})
