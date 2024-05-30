import { specRequest as request } from '../../../../spec-helpers'

describe('a visitor attempts to hit an unauthed route', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('accepts the request', async () => {
    await request.get('/ping', 200)
  })
})
