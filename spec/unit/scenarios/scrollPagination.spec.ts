import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../src/server/index.js'
import User from '../../../test-app/src/app/models/User.js'

describe('when using a controller that implements scrollPagination', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('correctly paginates results', async () => {
    const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
    const results = await request.get('/users/scroll-paginated', 200)

    expect(results.body).toEqual({
      cursor: null,
      results: [{ id: user.id }],
    })
  })

  context('scrollPagination', () => {
    beforeEach(async () => {
      // user a loop, not promise.all, so that the model ids are in a deterministic order
      for (let i = 0; i < 25; i++) {
        await User.create({ email: `how@yadoin${i}`, password: 'howyadoin', name: 'fredo' })
      }
    })

    it('includes the correct cursor', async () => {
      const ids = await User.order('createdAt').pluck('id')
      const cursor = (await User.order('createdAt').lastOrFail()).id.toString()
      const results = await request.get('/users/scroll-paginated', 200)

      expect(results.body).toEqual({
        cursor,
        results: ids.map(id => ({ id })),
      })
    })

    context('query is sent with cursor param', () => {
      it('responds to page param', async () => {
        const cursor = (await User.order('createdAt').lastOrFail()).id.toString()
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
        const results = await request.get('/users/scroll-paginated', 200, { query: { cursor } })

        expect(results.body).toEqual({
          cursor: null,
          results: [{ id: user.id }],
        })
      })
    })

    context('request body is sent with cursor param', () => {
      it('responds to page param', async () => {
        const cursor = (await User.order('createdAt').lastOrFail()).id.toString()
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
        const results = await request.post('/users/scroll-paginated-post', 200, { data: { cursor } })

        expect(results.body).toEqual({
          cursor: null,
          results: [{ id: user.id }],
        })
      })
    })
  })
})
