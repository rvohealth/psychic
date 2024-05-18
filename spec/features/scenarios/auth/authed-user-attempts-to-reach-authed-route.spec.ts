import User from '../../../../test-app/app/models/User'
import send from '../../../../spec-helpers/send'

describe('an authed user attempts to hit an authed route', () => {
  beforeEach(async () => {
    await User.create({ email: 'how@yadoin', password: 'password' })
  })

  it('returns 200', async () => {
    const authedSession = await send.session('/auth', { email: 'how@yadoin', password: 'password' }, 204)
    const res = await authedSession.get('/auth-ping').expect(200)
    expect(res.body).toEqual('helloworld')
  })
})
