# Contributing to Psychic

Thanks for helping out. This guide covers getting from a fresh clone to a pull request that passes CI. If you use an AI coding agent, it also follows [`AGENTS.md`](AGENTS.md).

## Reporting bugs

- **Don't open a public issue for a security vulnerability.** Follow [SECURITY.md](SECURITY.md) instead.
- Search the [issues](https://github.com/rvohealth/psychic/issues) first; someone may have reported it already.
- If nobody has, [open a new issue](https://github.com/rvohealth/psychic/issues/new). Include the Psychic, Dream, Node, Postgres and TypeScript versions, a description of the problem, and a small example that reproduces it.

## Prerequisites

- **Node.js 26 or 24.** Psychic supports Node 24 and newer. Node 26 is the primary CI and release runtime. CI also runs on Node 24, and the unit specs run on Node 25 as well. Runtime code and published types must keep working on Node 24.
- **pnpm 12.14.0.** It is pinned in the `packageManager` field of `package.json`, with a hash. The easiest way to get it is corepack, which reads that pin.
  - **Node 24.12.0 or later:** run `corepack enable`.
  - **Node 24 releases older than 24.12.0** bundle corepack 0.34.4 or older. That corepack can't launch pnpm 12, so every `pnpm` command fails with `MODULE_NOT_FOUND` for `.../pnpm/12.14.0/bin/pnpm.cjs`. Run `npm i -g corepack@0.34.7` first (or anything newer), then `corepack enable`. Upgrading Node also fixes it.
  - **Node 26** doesn't bundle corepack. Run `npm i -g corepack`, then `corepack enable`.
  - **A standalone pnpm** (e.g. `npm i -g pnpm`) also works. It switches to the pinned 12.14.0 in the repo root. However, `client/` has no `packageManager` field of its own, so there your global pnpm version runs, not the pin. Corepack applies the root pin in `client/` too, which is how CI installs it.
- **PostgreSQL.** CI uses `postgres:13`.
- **[oasdiff](https://github.com/oasdiff/oasdiff)** on your `PATH`, for the unit specs. `spec/unit/bin/helpers/OpenapiSpecDiff.spec.ts` runs the real binary. CI installs it with `go install github.com/oasdiff/oasdiff@latest`. `brew install oasdiff` works on macOS.
- **Firefox for Puppeteer**, for the feature specs only (see [Feature specs](#feature-specs)).

You don't need Redis. CI starts a Redis service, but nothing in `test-app/` or `spec/` connects to it.

## Setup

```bash
git clone https://github.com/rvohealth/psychic
cd psychic
pnpm install --frozen-lockfile
```

### Environment files

The specs and `pnpm psy` (which defaults to `NODE_ENV=test`) read `.env.test`. `pnpm dev` and `pnpm console` run in development and read `.env`. Both files are gitignored, so you create them yourself in the repo root:

```bash
# .env.test
PORT=7777
DB_USER=WHO_AM_I
DB_NAME=psychic_core_test
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY="REPLACE_ME"
LEGACY_APP_ENCRYPTION_KEY="REPLACE_ME"
```

```bash
# .env (only for pnpm dev / pnpm console)
DB_USER=WHO_AM_I
DB_NAME=psychic_core_dev
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY="REPLACE_ME"
LEGACY_APP_ENCRYPTION_KEY="REPLACE_ME"
```

- Replace `WHO_AM_I` with your Postgres user. On a local install that is usually the output of `whoami`.
- Add `DB_PASSWORD=...` if your Postgres needs a password. Add `DB_USE_SSL=1` if it needs TLS.
- For the encryption keys, run any `pnpm psy` command (e.g. `pnpm psy db:migrate`) with the placeholder values. Dream reports that the keys are invalid and prints valid generated keys. Paste those in.
- Optional: CI sets `TZ=UTC` and `DREAM_PARALLEL_TESTS=4`. If you set `DREAM_PARALLEL_TESTS`, run `pnpm psy db:migrate` with it set, so the extra test databases exist. The unit suite also uses that value as its worker count unless you set `PSYCHIC_UNIT_MAX_WORKERS` (CI sets it to `1`).

### Database

```bash
pnpm psy db:reset     # drop, create, migrate and sync the test database
pnpm psy db:migrate   # after pulling new migrations
```

`db:migrate` and `db:reset` also run `pnpm psy sync`, which regenerates the OpenAPI files and types under `test-app/`. Commit what it produces (see [Running checks](#running-checks)).

## Running checks

| What                                       | Command                                                   | CI job                         |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------ |
| ESLint + Prettier check                    | `pnpm lint`                                               | Linting (Node 26, 24)          |
| Format                                     | `pnpm format`                                             | n/a                            |
| Build the package                          | `pnpm build`                                              | Check build (Node 26, 24)      |
| Type-check the package, specs and test app | `pnpm build:test-app`                                     | Check build (Node 26, 24)      |
| Unit specs                                 | `pnpm uspec`                                              | Unit tests (Node 26, 24, 25)   |
| Feature specs                              | `pnpm fspec`                                              | Feature tests (Node 24)        |
| Generated files are committed              | `pnpm psy sync`, then `git diff` must be empty            | Ensure no sync diffs (Node 26) |
| Cooldown policy                            | see [Dependencies](#dependencies-and-supply-chain-policy) | Cooldown exclude allowlist     |

Notes:

- `pnpm lint` runs `prettier . --check` over the whole working tree. Prettier honors `.gitignore` and `.prettierignore`, but not `.git/info/exclude`. A local scratch file or directory excluded only there can fail `pnpm lint` on your machine, while CI passes on a clean checkout.
- Both `pnpm build` and `pnpm build:test-app` start by deleting `dist/`.

### Unit specs

```bash
pnpm uspec                                    # everything
pnpm uspec spec/unit/controller/ok.spec.ts    # one file
pnpm uspec spec/unit/controller/              # one directory
```

To run one example with `it.only`, temporarily add `allowOnly: true` to `spec/unit/vite.config.ts`. Don't commit that change.

### Feature specs

The feature specs drive the React app in `client/` with Puppeteer and Firefox. One-time setup:

```bash
(cd client && pnpm install --frozen-lockfile)
pnpm puppeteer browsers install firefox
```

The browser has to be installed by that explicit command, because dependency build scripts are blocked (see `allowBuilds` below).

Then run `pnpm fspec`. It accepts a file or directory like `pnpm uspec`, and `it.only` needs `allowOnly: true` in `spec/features/vite.config.ts`. The global setup starts the client's Vite dev server on port 3000 (`pnpm client:fspec`), and the specs start the Psychic server on port 7778 (`DEV_SERVER_PORT`), so keep both ports free. Set `HEADLESS=0` to watch the browser, or `DEBUG=1` to see its output.

## Dependencies and supply-chain policy

- **Install policy lives in `pnpm-workspace.yaml`.** That covers `minimumReleaseAge: 4320`, the 3-day release-age cooldown, and `minimumReleaseAgeExclude`, which must list only `@rvoh/*`. It also covers `allowBuilds`, the allowlist of dependencies that may run install scripts. Keep that list minimal: each entry re-enables install scripts for that package.
- **`client/` is a separate pnpm project.** It has its own `package.json`, `pnpm-lock.yaml` and `pnpm-workspace.yaml`, including its own cooldown, because it doesn't inherit the root settings. When dependencies change, regenerate each lockfile with its own manifest.
- **`.npmrc` pins the registry and nothing else.** pnpm 11 and later ignore release-age settings there.
- **CI enforces the cooldown policy.** The `check-cooldown-excludes` job asks the pinned pnpm what it resolved in the root and in `client/`. It fails if either one lacks a positive `minimumReleaseAge`, if either exclude list holds anything that isn't `@rvoh/*`, or if `.npmrc` has a non-`@rvoh` exclude.
- **Don't add a third-party package to `minimumReleaseAgeExclude`.** [SECURITY.md](SECURITY.md) covers urgent third-party patches: apply a transient override that you revert later. If you add or remove an `overrides` entry, or change the cooldown or `allowBuilds`, say so and say why in the PR description.
- **`@rvoh/*` versions move together.** `@rvoh/dream`, `@rvoh/dream-spec-helpers` and `@rvoh/psychic-spec-helpers` are devDependencies, and `@rvoh/dream` is also a peer dependency. Check `npm view @rvoh/dream peerDependencies` before bumping, because Dream pins the `kysely` and `commander` majors.

## Changes and pull requests

- Branch from an up-to-date `main` and open a pull request against `main`. Pull requests are merged through the GitHub UI. Describe both the problem and the fix, and link an issue if there is one.
- **Version and CHANGELOG.** A public-facing change needs both a `version` bump in `package.json` and a `CHANGELOG.md` entry, in the same PR. That covers features, bug fixes, behavior, API or CLI changes, generated output, and documentation-affecting framework changes. Write entries for people who use Psychic: what changed for them, and what to do about it.
- **Public error exports.** Export an error only when a Psychic app developer needs to throw it, or should reasonably catch it as part of an expected workflow. Being useful for debugging or internals isn't enough. If an error stays exported only for backward compatibility, document it as such. [AGENTS.md](AGENTS.md) has the full rule.
- **Node 24 compatibility.** Don't use Node 25 or 26-only runtime APIs in `src/`.
- **Run before pushing:** `pnpm lint`, `pnpm build`, `pnpm build:test-app` and `pnpm uspec`. Also run `pnpm fspec` if you touched anything the browser flow exercises. After changing migrations, routes, serializers or OpenAPI, run `pnpm psy sync` and commit the result.
- [CODEOWNERS](CODEOWNERS) lists the maintainers who review PRs.

## Releases

Maintainers publish from GitHub Actions with npm trusted publishing. They merge a PR that bumps `version` and `CHANGELOG.md`, then publish a GitHub release whose tag is `vX.Y.Z`, matching `package.json`. The `release.yml` workflow builds the package and publishes it with provenance. [RELEASING.md](RELEASING.md) has the details.
