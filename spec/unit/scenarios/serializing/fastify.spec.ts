import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicServer from '../../../../src/server/index.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('serializing', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  context('when fastify is leveraged for speedy rendering', () => {
    it('correctly renders nested refs', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const post = await user.createAssociation('posts')
      const { body } = await request.get(`/users/${user.id}`, 200)
      console.dir(body, { depth: null })
    })
  })
})
