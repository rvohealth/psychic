import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src/index.js'

describe('default caching behavior', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('provides Cache-Control: max-age=0, private, must-revalidate header by default', async () => {
    const response = await request.get('/users/howyadoin', 204)
    expect(response.headers['cache-control']).toEqual('max-age=0, private, must-revalidate')
  })
})
