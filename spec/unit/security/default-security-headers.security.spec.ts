import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src/package-exports/index.js'

// R-005 Psychic shipped with X-Content-Type-Options only. For a framework
// that primarily serves JSON/XML to fetch/XHR clients, the document-scoped
// headers (X-Frame-Options, COOP, Permissions-Policy, Referrer-Policy, CSP)
// are no-ops on API responses — they gate rendering behavior that never
// happens for an fetched JSON payload. The headers that DO apply regardless
// of content-type are the MIME-sniffing guard, Cross-Origin-Resource-Policy
// (mitigates cross-origin speculative reads), and HSTS.

describe('Default security response headers (R-005)', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await request.get('/ping', 200)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('sets Cross-Origin-Resource-Policy: same-origin', async () => {
    const res = await request.get('/ping', 200)
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin')
  })

  it('does NOT set Strict-Transport-Security in the test environment', async () => {
    // HSTS intentionally prod-only; enabling it under http://localhost would
    // poison the browser cache for any local dev domain.
    const res = await request.get('/ping', 200)
    expect(res.headers['strict-transport-security']).toBeUndefined()
  })

  it('does not add HTML-document-scoped headers by default', async () => {
    // These headers only take effect when a response is rendered as an HTML
    // document. For a JSON/XML API they're bytes on the wire with no browser
    // effect; apps that serve HTML opt in via defaultResponseHeaders.
    const res = await request.get('/ping', 200)
    expect(res.headers['x-frame-options']).toBeUndefined()
    expect(res.headers['cross-origin-opener-policy']).toBeUndefined()
    expect(res.headers['permissions-policy']).toBeUndefined()
    expect(res.headers['content-security-policy']).toBeUndefined()
  })
})
