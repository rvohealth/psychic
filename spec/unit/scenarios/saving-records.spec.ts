import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../src/server/index.js'
import User from '../../../test-app/src/app/models/User.js'

describe('a visitor attempts to save a record', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 201', async () => {
    await request.post('/users', 201, {
      data: {
        user: {
          email: 'how@yadoin',
          password: 'howyadoin',
        },
      },
    })
    expect(await User.where({ email: 'how@yadoin' }).count()).toEqual(1)
  })

  context('with a record that is invalid at Dream validation level', () => {
    it('does not save, throws 422', async () => {
      const res = await request.post('/failed-to-save-test', 422)
      expect(res.body).toEqual({ errors: { email: ['contains'] } })
    })
  })

  context('with a record that is invalid at DB level', () => {
    it('does not save, throws 422', async () => {
      await request.post('/failed-to-save-db-test', 422)
    })
  })

  context('with a response that throws', () => {
    beforeEach(() => {
      process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = '1'
    })

    afterEach(() => {
      process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR = undefined
    })

    it('throws 500', async () => {
      await request.post('/force-throw', 500)
      expect(await User.count()).toEqual(0)
    })
  })

  context(
    'with a request that has invalid params, and controller is leveraging Params.for for validation',
    () => {
      it('throws 400', async () => {
        const response = await request.post('/users', 400, {
          data: { user: { email: 123, password: 'howyadoin', name: 456 } },
        })
        expect(response.body).toEqual({ errors: { email: ['expected string'], name: ['expected string'] } })
        expect(await User.count()).toEqual(0)
      })
    },
  )
})
