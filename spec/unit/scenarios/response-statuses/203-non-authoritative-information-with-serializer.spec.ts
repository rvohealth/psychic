import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server/index.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('nonAuthoritativeInformation is passed a serializer', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
  })

  it('renders the serializer with the controller passthrough', async () => {
    const res = await request.get(`/users/${user.id}/non-authoritative-information-with-serializer`, 203)
    expect(res.body).toEqual({
      reason: 'taken',
      user: { id: user.id, howyadoin: 'howyadoin' },
    })
  })
})
