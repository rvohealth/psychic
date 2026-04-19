/**
 * Returns true when `target` is a safe destination for an HTTP redirect.
 *
 * A safe target is either:
 *   - a same-origin relative path beginning with a single `/` (not `//`, not `/\`),
 *     with no control characters (CR/LF/NUL/etc.) that would enable response-splitting
 *   - an absolute `http:` or `https:` URL whose hostname exactly matches an entry in
 *     `opts.allowedHosts` (case-insensitive, port-insensitive — use explicit
 *     entries with a port if port-restriction is desired at a deeper layer)
 *
 * Everything else is rejected, including:
 *   - `javascript:`, `data:`, `vbscript:`, `file:` and other non-http(s) schemes
 *   - scheme-relative URLs (`//evil.com`) and their backslash variants (`/\evil.com`)
 *   - absolute URLs to hostnames not in the allowlist (even with userinfo tricks
 *     like `http://allowed.com@evil.com/…` — WHATWG URL parses the host as `evil.com`)
 *   - any input containing ASCII control characters, leading/trailing whitespace,
 *     or raw NULs
 *
 * The allowlist is purposely restrictive (no wildcards yet). Applications that
 * legitimately redirect to external destinations register hosts via
 * `PsychicApp.set('redirectAllowedHosts', ['oauth.example.com'])`.
 */
export default function isSafeRedirectTarget(
  target: unknown,
  opts: { allowedHosts: readonly string[] },
): boolean {
  if (typeof target !== 'string') return false
  if (target.length === 0) return false

  // Reject any control character (CR, LF, NUL, BEL, DEL …). Without this,
  // `\r\n` in the Location value enables header / response splitting.
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(target)) return false

  // Whitespace padding is used to defeat simple prefix checks; require a
  // clean input rather than silently trimming.
  if (target !== target.trim()) return false

  // Scheme-relative URLs and their backslash variants are treated by browsers
  // as network-path references and would escape the origin.
  if (target.startsWith('//')) return false
  if (target.startsWith('\\')) return false
  if (target.startsWith('/\\')) return false
  if (target.startsWith('/%5C') || target.startsWith('/%5c')) return false

  // Relative same-origin path: must begin with exactly one '/'.
  if (target.startsWith('/')) return true

  // Absolute URLs are validated via the WHATWG URL parser. This normalizes
  // userinfo / percent-encoding / unicode-homograph tricks so the allowlist
  // check runs against the parsed hostname rather than a raw substring.
  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false

  const hostname = parsed.hostname.toLowerCase()
  return opts.allowedHosts.some(allowed => allowed.toLowerCase() === hostname)
}
