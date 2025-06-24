import { PsychicServer } from '../../../src/index.js'
import { specRequest as request } from '@rvoh/psychic-spec-helpers'

describe('PsychicServer hooks', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('GET', () => {
    it('processes middleware', async () => {
      const res = await request.get('/middleware-test', 200)
      expect(res.body).toEqual('get middleware test')
    })
  })

  context('POST', () => {
    it('processes middleware', async () => {
      const res = await request.post('/middleware-test', 200)
      expect(res.body).toEqual('post middleware test')
    })
  })

  context('PUT', () => {
    it('processes middleware', async () => {
      const res = await request.put('/middleware-test', 200)
      expect(res.body).toEqual('put middleware test')
    })
  })

  context('PATCH', () => {
    it('processes middleware', async () => {
      const res = await request.patch('/middleware-test', 200)
      expect(res.body).toEqual('patch middleware test')
    })
  })

  context('DELETE', () => {
    it('processes middleware', async () => {
      const res = await request.delete('/middleware-test', 200)
      expect(res.body).toEqual('delete middleware test')
    })
  })

  context('namespacing', () => {
    it('processes namespaced middleware', async () => {
      await request.get('/nested-middleware/middleware-test', 200)
    })
  })
})
