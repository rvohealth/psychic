# Releasing

`@rvoh/psychic` is published to npm automatically by GitHub Actions using
[OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers/). No npm
token is stored anywhere, and every release is published with a signed
[provenance attestation](https://docs.npmjs.com/generating-provenance-statements/).

## One-time setup (per package, performed by an npm owner)

Automated releases do not work until a maintainer registers this repository as a
trusted publisher on npm:

1. Sign in to npmjs.com as an owner of `@rvoh/psychic`.
2. Open the package page → **Settings** → **Trusted Publishers**.
3. Add a **GitHub Actions** publisher:
   - Organization or user: `rvohealth`
   - Repository: `psychic`
   - Workflow filename: `release.yml`
   - Environment name: _(leave blank)_
4. Recommended hardening: under **Settings → Publishing access**, select
   **Require two-factor authentication and disallow tokens**. With trusted
   publishing in place, no automation token is needed.

## Cutting a release

1. Open a PR that bumps `version` in `package.json` and adds a `CHANGELOG.md`
   entry, then merge it to `main`.
2. On GitHub, go to **Releases → Draft a new release**.
3. Create a new tag named `vX.Y.Z` that exactly matches the `package.json`
   version (the workflow fails the publish if they differ). Target `main`.
4. Write the release notes and click **Publish release**.
5. The **Release** workflow builds the package and publishes it to npm with
   provenance. Confirm the new version appears on npm with a provenance badge.

## Notes

- The workflow runs on `release: published`, so a _draft_ release does not
  publish anything until you click **Publish release**.
- Never add `NODE_AUTH_TOKEN` to the release workflow; its presence forces the
  legacy token path and disables OIDC trusted publishing.
- Publishing still runs the package's `prepack`/`build`, so a broken build
  blocks the release.
