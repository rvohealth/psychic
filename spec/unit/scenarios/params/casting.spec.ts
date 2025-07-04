import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server/index.js'

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

  context('array params', () => {
    context('when those query params are array query params', () => {
      it('parses the query array with single param', async () => {
        const res = await request.get('/display-params', 200, {
          query: {
            howyadoin: ['cool'],
          },
        })
        expect(res.body).toEqual(['cool'])
      })

      it('parses the query array with multiple params', async () => {
        const res = await request.get('/display-params', 200, {
          query: {
            howyadoin: ['cool', 'boy', 'jones'],
          },
        })
        expect(res.body).toEqual(['cool', 'boy', 'jones'])
      })

      context('with explicit array brackets', () => {
        it('parses the query array with single param', async () => {
          const res = await request.get('/display-params', 200, {
            query: {
              'howyadoin[]': ['cool'],
            },
          })
          expect(res.body).toEqual(['cool'])
        })

        it('parses the query array with multiple params', async () => {
          const res = await request.get('/display-params', 200, {
            query: {
              'howyadoin[]': ['cool', 'boy', 'jones'],
            },
          })
          expect(res.body).toEqual(['cool', 'boy', 'jones'])
        })
      })
    })
  })
})
