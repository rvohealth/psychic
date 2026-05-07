import { agent as supertest } from 'supertest'
import PsychicRouter from '../../../src/router/index.js'
import PsychicServer from '../../../src/server/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicRouter trailing slash handling', () => {
  describe('registered path', () => {
    let server: PsychicServer
    let router: PsychicRouter

    beforeEach(() => {
      server = new PsychicServer()
      router = new PsychicRouter(server.koaApp)
    })

    it('does not append a trailing slash when an empty path is registered inside a namespace', () => {
      router.namespace('foo', r => {
        r.put('', UsersController, 'ping')
      })
      router.commit()

      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'put',
            path: '/foo',
            controller: UsersController,
            action: 'ping',
          },
        ]),
      )
    })

    it('does not append a trailing slash when an empty path is registered inside nested namespaces', () => {
      router.namespace('a', r => {
        r.namespace('b', r => {
          r.namespace('c', r => {
            r.get('', UsersController, 'ping')
            r.post('', UsersController, 'ping')
          })
        })
      })
      router.commit()

      expect(router.routes).toEqual(
        expect.arrayContaining([
          {
            httpMethod: 'get',
            path: '/a/b/c',
            controller: UsersController,
            action: 'ping',
          },
          {
            httpMethod: 'post',
            path: '/a/b/c',
            controller: UsersController,
            action: 'ping',
          },
        ]),
      )
    })
  })

  it('matches a route registered inside a namespace with an empty path when called WITH a trailing slash', async () => {
    const server = new PsychicServer()
    await server.boot()

    const res = await supertest(server.koaApp.callback()).put('/trailing-slash-test/').expect(200)
    expect(res.body).toEqual('helloworld')
  })

  it('matches a route registered inside a namespace with an empty path when called WITHOUT a trailing slash', async () => {
    const server = new PsychicServer()
    await server.boot()

    const res = await supertest(server.koaApp.callback()).put('/trailing-slash-test').expect(200)
    expect(res.body).toEqual('helloworld')
  })

  it('matches a GET route registered inside a namespace with an empty path WITHOUT a trailing slash', async () => {
    const server = new PsychicServer()
    await server.boot()

    const res = await supertest(server.koaApp.callback()).get('/trailing-slash-test').expect(200)
    expect(res.body).toEqual('helloworld')
  })

  it('matches a POST route registered inside a namespace with an empty path WITHOUT a trailing slash', async () => {
    const server = new PsychicServer()
    await server.boot()

    const res = await supertest(server.koaApp.callback()).post('/trailing-slash-test').expect(200)
    expect(res.body).toEqual('helloworld')
  })
})
