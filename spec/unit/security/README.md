# Psychic Security Specs

Regression specs for the Psychic security audit program.

## Scope

These specs cover attacker-leverage vulnerability classes relevant to Psychic: open redirect, CSRF absence, session fixation, cookie flag defaults, HTTP security headers, CORS default behavior, mass-assignment hardening, parameter-parser prototype pollution, log/error disclosure, i18n escaping, and OpenAPI / devtool exposure in production.

ORM-layer concerns (SQL injection, operator escape hatches, encryption semantics) live in Dream's security spec suite.

## Conventions

- **File naming:** `*.security.spec.ts` — the `.security` infix makes them easy to grep and run as a batch.
- **One attacker scenario per `describe` block.** Each `it` asserts a single fail-closed outcome for that attacker input.
- **Always assert fail-closed.** Security specs assert that unsafe inputs are rejected, that output does not leak, or that an invariant holds — not that the happy path works.
- **Name the vulnerability class in the `describe` title.** Example: `describe('controller.redirect — rejects cross-origin destinations (R-001)', ...)`.
- **Reference the risk-register ID** in the describe title or a leading comment so audit coverage can be traced to `SECURITY_AUDIT_TRACKER.md`.
- **Integration over unit when the attack touches the request pipeline.** Open-redirect, CSRF, cookie-flag, and header specs should exercise the full router → controller → response path via `supertest` or the existing scenario-spec patterns.

## Running

```bash
pnpm uspec spec/unit/security/
```

Or a single file:

```bash
pnpm uspec spec/unit/security/cors-defaults.security.spec.ts
```

## Phase mapping

See `~/work/dream_and_psychic/SECURITY_AUDIT_TRACKER.md` for the per-phase finding-to-spec mapping.
