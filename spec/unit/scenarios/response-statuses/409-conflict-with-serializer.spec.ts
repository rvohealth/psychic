import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server/index.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('an error helper is passed a serializer', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
  })

  const expectedBody = () => ({
    reason: 'taken',
    user: { id: user.id, howyadoin: 'howyadoin' },
  })

  it('renders the serializer with the controller passthrough', async () => {
    const res = await request.get(`/users/${user.id}/conflict-with-serializer`, 409)
    expect(res.body).toEqual(expectedBody())
  })

  context('without fastJsonStringify', () => {
    it('renders the serializer with the controller passthrough', async () => {
      const res = await request.get(
        `/users/${user.id}/conflict-with-serializer-without-fast-json-stringify`,
        409,
      )
      expect(res.body).toEqual(expectedBody())
    })
  })

  context('with an array of serializers', () => {
    it('renders each serializer with the controller passthrough', async () => {
      const res = await request.get(`/users/${user.id}/conflict-with-serializer-array`, 409)
      expect(res.body).toEqual([expectedBody()])
    })
  })
})
