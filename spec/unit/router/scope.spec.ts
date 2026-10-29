import PsychicServer from '../../../src/server/index.js'
import withLoopbackAgent from '../helpers/withLoopbackAgent.js'

describe('PsychicRouter', () => {
  describe('scoped routes', () => {
    it('can direct scoped routes to their respective controllers', async () => {
      const server = new PsychicServer()
      await server.boot()

      const res = await withLoopbackAgent(server.koaApp, agent =>
        agent.get('/scoped-things/testing-scopes').expect(200),
      )

      expect(res.body).toEqual('helloscopedworld')
    })
  })
})
