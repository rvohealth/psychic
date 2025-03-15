import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server.js'

describe('hitting an endpoint that calls castParam', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 204 with the param present', async () => {
    await request.post('/cast-param-test', 204, {
      data: {
        testString: 'hi',
      },
    })
  })

  context('with the test field not present in params', () => {
    it('throws a 400', async () => {
      await request.post('/cast-param-test', 400)
    })
  })
})
