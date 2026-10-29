import PsychicServer from '../../../src/server/index.js'
import withLoopbackAgent from '../helpers/withLoopbackAgent.js'

describe('PsychicRouter', () => {
  describe('#options', () => {
    it('can direct post requests to controller', async () => {
      const server = new PsychicServer()
      await server.boot()
      await withLoopbackAgent(server.koaApp, agent => agent.options('/ping').expect(200))
    })
  })
})
