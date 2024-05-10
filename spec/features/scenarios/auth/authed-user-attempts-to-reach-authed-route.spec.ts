import supertest from 'supertest'
import User from '../../../../test-app/app/models/User'
import send from '../../../../spec-helpers/send'

describe('an authed user attempts to hit an authed route', () => {
  let authedSession: ReturnType<typeof supertest>

  beforeEach(async () => {
    await User.create({ email: 'how@yadoin', password: 'password' })
    authedSession = await send.session('/auth', { email: 'how@yadoin', password: 'password' }, 204)
  })

  it('returns 200', async () => {
    const res = await authedSession.get('/auth-ping').expect(200)
    expect(res.body).toEqual('helloworld')
  })
})
