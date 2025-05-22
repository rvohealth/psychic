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

  context('pagination', () => {
    beforeEach(async () => {
      await Promise.all(
        [...Array<null>(25)].map((_, i) =>
          User.create({ email: `how@yadoin${i}`, password: 'howyadoin', name: 'fredo' }),
        ),
      )
    })

    context('query is sent with page param', () => {
      it('responds to page param', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
        const results = await request.get('/users/paginated', 200, { query: { page: 2 } })

        expect(results.body).toEqual({
          recordCount: 26,
          pageCount: 2,
          currentPage: 2,
          results: [{ id: user.id }],
        })
      })
    })

    context('request body is sent with page param', () => {
      it('responds to page param', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
        const results = await request.post('/users/paginated-post', 200, { data: { page: 2 } })

        expect(results.body).toEqual({
          recordCount: 26,
          pageCount: 2,
          currentPage: 2,
          results: [{ id: user.id }],
        })
      })
    })
  })
})
