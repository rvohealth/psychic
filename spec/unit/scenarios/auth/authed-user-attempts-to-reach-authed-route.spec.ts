import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../../src'
import User from '../../../../test-app/src/app/models/User'

describe('an authed user attempts to hit an authed route', () => {
  beforeEach(async () => {
    await User.create({ email: 'how@yadoin', password: 'password' })
    await request.init(PsychicServer)
  })

  it('returns 200', async () => {
    const authedSession = await request.session('/auth', { email: 'how@yadoin', password: 'password' }, 204)
    const res = await authedSession.get('/auth-ping', 200)
    expect(res.body).toEqual('helloworld')
  })
})
