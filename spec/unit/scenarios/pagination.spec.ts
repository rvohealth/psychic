import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../src/server/index.js'
import User from '../../../test-app/src/app/models/User.js'

describe('when using a controller that implements pagination', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('correctly paginates results', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
    const results = await request.get('/users/paginated', 200)

    expect(results.body).toEqual({
      recordCount: 1,
      pageCount: 1,
      currentPage: 1,
      results: [{ id: user.id }],
    })
  })
})
