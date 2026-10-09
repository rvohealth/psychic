import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { Encrypt } from '@rvoh/dream/utils'
import { PsychicServer } from '../../../../src/package-exports/index.js'

describe('a visitor with an auth cookie that cannot be decrypted attempts to hit an authed route', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('returns 401, reading the cookie as absent, not 500', async () => {
    const foreignKeyCookie = Encrypt.encrypt('1', {
      algorithm: 'aes-256-gcm',
      key: Encrypt.generateKey('aes-256-gcm'),
    })
    await request.get('/auth-ping', 401, { headers: { Cookie: `auth_token=${foreignKeyCookie}` } })
  })

  it('returns 401 for a garbage cookie', async () => {
    await request.get('/auth-ping', 401, { headers: { Cookie: 'auth_token=not-a-real-cookie' } })
  })
})
