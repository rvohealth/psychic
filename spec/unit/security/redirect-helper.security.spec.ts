import isSafeRedirectTarget from '../../../src/helpers/isSafeRedirectTarget.js'

// R-001 open redirect via controller redirect helpers.
// Prior behavior: controller.redirect(path) passed `path` straight through to
// ctx.redirect — any attacker-controlled string reached the Location header.
// isSafeRedirectTarget is the gate now wired into koaRedirect.

describe('isSafeRedirectTarget — same-origin relative paths', () => {
  const noHosts = { allowedHosts: [] as readonly string[] }

  it('allows a simple path', () => {
    expect(isSafeRedirectTarget('/dashboard', noHosts)).toBe(true)
  })

  it('allows a nested path with query string and fragment', () => {
    expect(isSafeRedirectTarget('/users/42?tab=profile#bio', noHosts)).toBe(true)
  })

  it('allows root', () => {
    expect(isSafeRedirectTarget('/', noHosts)).toBe(true)
  })
})

describe('isSafeRedirectTarget — scheme-relative and backslash tricks', () => {
  const noHosts = { allowedHosts: [] as readonly string[] }

  it('rejects protocol-relative `//evil.com`', () => {
    expect(isSafeRedirectTarget('//evil.com', noHosts)).toBe(false)
  })

  it('rejects protocol-relative with path `//evil.com/steal`', () => {
    expect(isSafeRedirectTarget('//evil.com/steal', noHosts)).toBe(false)
  })

  it('rejects `/\\evil.com` (backslash-as-slash in old browsers)', () => {
    expect(isSafeRedirectTarget('/\\evil.com', noHosts)).toBe(false)
  })

  it('rejects leading backslash `\\evil.com`', () => {
    expect(isSafeRedirectTarget('\\evil.com', noHosts)).toBe(false)
  })

  it('rejects percent-encoded backslash `/%5Cevil.com`', () => {
    expect(isSafeRedirectTarget('/%5Cevil.com', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('/%5cevil.com', noHosts)).toBe(false)
  })
})

describe('isSafeRedirectTarget — non-http schemes', () => {
  const noHosts = { allowedHosts: [] as readonly string[] }

  it('rejects javascript: URIs', () => {
    expect(isSafeRedirectTarget('javascript:alert(1)', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('JavaScript:alert(1)', noHosts)).toBe(false)
  })

  it('rejects data: URIs', () => {
    expect(isSafeRedirectTarget('data:text/html,<script>alert(1)</script>', noHosts)).toBe(false)
  })

  it('rejects vbscript:, file:, gopher:, dict: schemes', () => {
    expect(isSafeRedirectTarget('vbscript:msgbox(1)', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('file:///etc/passwd', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('gopher://evil.com/', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('dict://evil.com/', noHosts)).toBe(false)
  })
})

describe('isSafeRedirectTarget — absolute URLs vs allowlist', () => {
  it('rejects https://evil.com when allowlist is empty', () => {
    expect(isSafeRedirectTarget('https://evil.com/', { allowedHosts: [] })).toBe(false)
  })

  it('rejects https://evil.com when allowlist is a different host', () => {
    expect(isSafeRedirectTarget('https://evil.com/', { allowedHosts: ['trusted.com'] })).toBe(false)
  })

  it('allows https://trusted.com when allowlisted', () => {
    expect(isSafeRedirectTarget('https://trusted.com/oauth', { allowedHosts: ['trusted.com'] })).toBe(true)
  })

  it('allows http scheme when allowlisted', () => {
    expect(isSafeRedirectTarget('http://trusted.com/oauth', { allowedHosts: ['trusted.com'] })).toBe(true)
  })

  it('matches allowlist case-insensitively', () => {
    expect(isSafeRedirectTarget('https://TRUSTED.com/', { allowedHosts: ['trusted.com'] })).toBe(true)
    expect(isSafeRedirectTarget('https://trusted.com/', { allowedHosts: ['TRUSTED.com'] })).toBe(true)
  })

  it('ignores port differences — allowlist is hostname-only', () => {
    expect(isSafeRedirectTarget('https://trusted.com:8443/', { allowedHosts: ['trusted.com'] })).toBe(true)
  })

  it('rejects userinfo trick http://trusted.com@evil.com/ — hostname parses as evil.com', () => {
    expect(isSafeRedirectTarget('http://trusted.com@evil.com/path', { allowedHosts: ['trusted.com'] })).toBe(
      false,
    )
  })

  it('rejects subdomain of an allowlisted host (exact match only, no wildcards)', () => {
    expect(isSafeRedirectTarget('https://evil.trusted.com/', { allowedHosts: ['trusted.com'] })).toBe(false)
  })
})

describe('isSafeRedirectTarget — control characters and whitespace', () => {
  const noHosts = { allowedHosts: [] as readonly string[] }

  it('rejects CR or LF in the target (response-splitting vector)', () => {
    expect(isSafeRedirectTarget('/path\r\nSet-Cookie: pwned=1', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('/path\nx', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('/path\rx', noHosts)).toBe(false)
  })

  it('rejects NUL and other low-ASCII controls', () => {
    expect(isSafeRedirectTarget('/path\x00', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('/path\x01', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('/path\x1f', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('/path\x7f', noHosts)).toBe(false)
  })

  it('rejects leading or trailing whitespace', () => {
    expect(isSafeRedirectTarget(' /dashboard', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('/dashboard ', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('\t/dashboard', noHosts)).toBe(false)
  })
})

describe('isSafeRedirectTarget — malformed inputs', () => {
  const noHosts = { allowedHosts: [] as readonly string[] }

  it('rejects the empty string', () => {
    expect(isSafeRedirectTarget('', noHosts)).toBe(false)
  })

  it('rejects non-string inputs', () => {
    expect(isSafeRedirectTarget(undefined, noHosts)).toBe(false)
    expect(isSafeRedirectTarget(null, noHosts)).toBe(false)
    expect(isSafeRedirectTarget(42, noHosts)).toBe(false)
    expect(isSafeRedirectTarget({ toString: () => '/safe' }, noHosts)).toBe(false)
  })

  it('rejects bare hostnames and unparsable URLs', () => {
    expect(isSafeRedirectTarget('evil.com', noHosts)).toBe(false)
    expect(isSafeRedirectTarget('mailto:', noHosts)).toBe(false)
  })
})
