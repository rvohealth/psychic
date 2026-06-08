# Security Policy

## Supported Versions

We currently support the latest version of Psychic v2. Our goal is to avoid breaking changes within major versions, facilitating incorporating security patches by updating to the latest minor and patch version within a supported major version.

## Reporting a Vulnerability

To report a vulnerability, please contact us at [psychic-security@rvohealth.com](mailto:psychic-security@rvohealth.com). Once the vulnerability is verified, a patch will be provided. Once the patch is provided, a new version will be published closing the vulnerability. Private contact will resume between the reporter and the code maintainers until the vulnerability is resolved.

## Supply-chain hardening

This package is developed and published with defenses against install-time supply-chain attacks (the Shai-Hulud class of npm worm, which runs from a dependency's `postinstall` and/or publishes a compromised version for maintainers to install before it is noticed):

- **Dependency build scripts are blocked by default.** pnpm 10+ does not run dependency lifecycle scripts; `pnpm-workspace.yaml` keeps a deliberately minimal `allowBuilds` allowlist (only the few packages that genuinely need to build). Every entry re-opens script execution, so additions require a clear reason.
- **Release-age cooldown.** `.npmrc` sets `minimumReleaseAge=4320` (3 days), so freshly-published dependency versions — the window in which most worm-injected releases are caught and unpublished — are not installed. Three days stays under the critical-CVE patch SLA, so routine patching never needs a bypass.
- **The cooldown exclude list is `@rvoh/*`-only, enforced in CI.** Only our own first-party packages are exempt from the cooldown. A CI check (`check-cooldown-excludes`) fails the build if any non-`@rvoh/*` entry is added to `minimumReleaseAgeExclude`, so a permanent third-party bypass cannot be introduced silently. Apply an urgent third-party patch with a transient, reverted override instead.
- **Registry pinning.** `.npmrc` pins the npm registry so installs cannot be redirected to a malicious mirror.

## Publishing posture

Releases are published **manually, from a maintainer's machine, gated by npm two-factor authentication** — there is no CI/token-based publish. This is a deliberate anti-worm choice: it keeps publishing credentials off CI (a prime target for self-propagating worms that harvest CI/CD secrets) and behind a human MFA prompt. npm provenance / OIDC publishing was evaluated and **deferred** for that reason — adopting it would relocate publishing into automated CI and trade the human MFA gate for a long-lived automated trust relationship. It remains a deliberate future decision, not a default.
