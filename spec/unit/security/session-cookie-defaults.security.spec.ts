import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src/package-exports/index.js'
import User from '../../../test-app/src/app/models/User.js'

// R-004 cookies set via Session.setCookie had no default SameSite attribute,
// so the browser would send the cookie on cross-site subresource requests —
// CSRF by default. Psychic is a pure JSON API backend (never renders HTML),
// so there is no link-click-navigates-to-Psychic UX that would require Lax.
// Strict is the correct default: the session cookie should only ride
// requests originated from our own client code.

describe('Session.setCookie — default cookie flags (R-004)', () => {
  beforeEach(async () => {
    await User.create({ email: 'sam@example.com', password: 'password' })
    await request.init(PsychicServer)
  })

  it('sets SameSite=Strict by default on session cookies', async () => {
    const res = await request.post('/auth', 204, {
      data: { email: 'sam@example.com', password: 'password' },
    })
    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    const joined = Array.isArray(cookies) ? cookies.join('\n') : String(cookies)
    expect(joined.toLowerCase()).toContain('samesite=strict')
  })

  it('sets HttpOnly by default on session cookies', async () => {
    const res = await request.post('/auth', 204, {
      data: { email: 'sam@example.com', password: 'password' },
    })
    const cookies = res.headers['set-cookie']
    const joined = Array.isArray(cookies) ? cookies.join('\n') : String(cookies)
    expect(joined.toLowerCase()).toContain('httponly')
  })
})
