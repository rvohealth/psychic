import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import PsychicApp from '../../../src/psychic-app/index.js'
import PsychicServer from '../../../src/server/index.js'
import User from '../../../test-app/src/app/models/User.js'

describe('PsychicServer body parsing', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
    vi.spyOn(PsychicApp.prototype, 'openapiValidationIsActive').mockReturnValue(false)
  })

  it('parses nested URL-encoded form fields before passing them to the controller', async () => {
    const email = 'urlencoded+form@example.com'

    await request.post('/users', 201, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: {
        user: {
          email,
          password: 'form-parser-regression',
        },
      },
    })

    expect(await User.where({ email }).count()).toEqual(1)
  })

  it('rejects URL-encoded bodies larger than the default 56 KB form limit', async () => {
    await request.post('/users', 413, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: {
        user: {
          email: 'oversized-form@example.com',
          password: 'x'.repeat(60 * 1024),
        },
      },
    })
  })
})
