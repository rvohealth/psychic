import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src/package-exports/index.js'
import User from '../../../test-app/src/app/models/User.js'

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

  context('passport', () => {
    it('can integrate with passport', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })
      const res = await request.post('/passport-test', 200, {
        data: {
          username: 'how@yadoin',
          password: 'password',
        },
      })
      expect(res.body).toEqual({ id: user.id })

      await request.post('/passport-test', 401, {
        data: {
          username: 'how@yadoin',
          password: 'WRONG PASSWORD',
        },
      })
    })

    it('can persist session between requests', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })
      const session = await request.session('/passport-test', 200, {
        httpMethod: 'post',
        data: {
          username: 'how@yadoin',
          password: 'password',
        },
      })

      const res = await session.get('/passport-test-persistence', 200)
      expect(res.body).toEqual({ id: user.id })
    })

    it('can persist session to a controller', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'password' })
      const session = await request.session('/passport-test', 200, {
        httpMethod: 'post',
        data: {
          username: 'how@yadoin',
          password: 'password',
        },
      })

      const res = await session.get('/controller-passport-test-persistence', 200)
      expect(res.body).toEqual({ id: user.id })
    })
  })
})
