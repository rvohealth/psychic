# AGENTS.md - AI Agent Instructions

This file provides instructions for AI agents working on this project.

## Starting New Work

Before starting any new work, switch to `main` and pull the latest, unless the
user explicitly instructs otherwise:

```bash
git switch main && git pull
```

We merge pull requests through the GitHub UI, so the local working branch is
often already merged into `origin/main`. Starting from a stale, already-merged
branch is the default failure mode this rule prevents.

## Decide From Project Standards Instead of Asking

When this file or another documented project rule answers a question, decide
the question from that rule and state in one line which rule you applied; do
not put it to a person. Ask only when nothing written answers it, or when the
answer conflicts with an explicit instruction. Existing code is evidence, not a
standard by itself: a practice becomes a standard when the code follows it
consistently for a reason you can state. When you decide from a standard that
is followed but not written down, write it into this file, with its reason, in
the same change, so the answer travels with the project.

## Release Requirements

For any public-facing functionality change, bug fix, behavior change, API change, CLI change, generated output change, or documentation-affecting framework change, update both:

- `package.json` version
- `CHANGELOG.md`

Do this before opening a PR.

## Node.js Support

Psychic supports Node.js 24 and newer. Node.js 26 is the primary CI and release runtime; keep Node.js 24 in the build, lint, and unit test matrix to verify the supported floor. Development types may target the current primary Node.js version, but runtime code and emitted public types must remain compatible with Node.js 24.

## Public Error Exports

Export an error only when a developer of a Psychic application needs to throw
it or should reasonably be able to catch it as part of an expected,
well-functioning application workflow. An error being useful for debugging,
logging, or framework internals does not by itself justify a public export.
Compatibility-only residue (an error kept exported only for backward
compatibility, not because new code should throw or catch it) must be
documented as such, not treated as proof it still belongs in the public API.

## Invalid Declarations: Refused by Types and at Boot

Refuse an invalid declaration (a route, a controller's `@OpenAPI` options, the
OpenAPI shape of a serializer attribute) in both of these places:

- **In TypeScript**, wherever the types can express the rule.
- **At boot, with a runtime check in the package that owns the declaration.**
  In Psychic that is `PsychicApp.init`, which builds the routes and renders
  every OpenAPI document with the same renderer `psy sync` uses. Dream checks
  its own declarations at class decoration, in the decorator-initialization
  pass of `DreamApp.init`, or, for a check that reads the database schema or
  compiles a model's declared shape (`@deco.JSON`, `@deco.Virtual`,
  `@deco.Encrypted`), in `DreamApp#validateApplicationModels`; Psychic calls
  Dream's check rather than repeating it. An invalid declaration must never
  surface first at sync, at a request or at a save.

Both halves are needed. Types leak: `as any`, wide-typed values, `as const`
constants and plain JavaScript all get past them. And a boot failure is caught
by every spec run and every deploy, while a failure on first use is found by a
user.

The error is not exported (see Public Error Exports), and its message names the
class, the declaration, and what to declare instead.

Rely on the types alone only when a declaration that slips past them is
harmless or fails closed, for example an unknown name that is ignored so that
nothing extra is accepted.

## Single Values Become Arrays Only in Query Strings

A single value given for an array parameter becomes a one-element array in
exactly two places:

- **`conformQueryArrayParamsToOpenapiShape`**, for a query parameter whose
  OpenAPI schema is an array, on an endpoint that validates its query. This
  covers clients, such as iOS, that send `tags=red` instead of `tags[]=red`.
- **An explicit `castParam` or `Params.cast` with an array type** (`'string[]'`,
  `'integer[]'` and so on), which names the array type for that one parameter.

`Params.for` (and `paramsFor` and `extractParams`, which call it) and every
other mass-assignment path never wrap a bare value. A bare value for an array
column, for a column or attribute whose `@deco.JSON`, `@deco.Virtual` or
`@deco.Encrypted` shape is an array, or for a `Params.for` call with
`array: true` is rejected with a 400.

The reason: a request body can tell a single value from a one-element array, so
converting one there hides a client bug. Only a query string is ambiguous. Do
not add single-value conversion anywhere else to make a request pass.

## Specs Read Real Declarations From the Test-App

A spec that needs a model to declare something (a `@deco.JSON`,
`@deco.Virtual` or `@deco.Encrypted` shape, an association, a column of a
given type or nullability) reads it from a test-app model that declares it
with the real decorator over a real column. When no model fits, add the model,
column or declaration to the test-app (see Changing the Test-App Schema).

Never stand in for a decorator: do not write the state it registers onto a
class (a model's `virtualAttributes`, `jsonColumnShapes` or association
metadata), patch a model's `schema`, or stub the lookup that reads them.

The reason: the test-app exists so that specs run the real code. A faked
declaration skips the decorator's own checks and Dream's checks at boot, so a
spec can pass against a state no app can reach, and its failures are hard to
debug. A declaration Dream refuses at boot cannot live in the test-app; that
refusal is specified in Dream.

## Database Commands

### Migrate the Database
```bash
pnpm psy db:migrate
```

### Reset the Database
Drop, create, and migrate the database:
```bash
pnpm psy db:reset
```

### Sync
Syncs OpenAPI changes, types, etc. This is automatically performed by `psy db:migrate` and `psy db:reset`, so it's not necessary to run separately if those are already being run.

### Changing the Test-App Schema
Edit the table's create migration in `test-app/src/db/migrations/` in place
(add a migration only for a new table), then run `pnpm psy db:reset`. Never add
an `alterTable` migration to the test-app. The reason: the test-app has no
deployed database to migrate forward (CI builds it fresh from the migrations on
every run), so one create migration per table keeps each table's schema readable
in one place.

## Build and Code Quality

### Build
Find TypeScript errors:
```bash
pnpm build:test-app
```

### Format Code
```bash
pnpm format
```

### Lint Code
```bash
pnpm lint
```

## CI Tooling: Industry Standards Only

Use the standard, documented mechanism a tool already provides, such as pnpm's
`minimumReleaseAge` for dependency cooldowns. Never hand-write CI scripts,
guards, or harnesses that re-verify a tool's own configuration. If a protection
needs enforcing against edits to its configuration, use code review, CODEOWNERS,
or branch protection on the configuration files, not a custom check. An agent
that believes a custom CI check is needed must stop and ask the owner, naming
the standard mechanism it could not find.

## Running Unit Specs

### All Unit Specs
```bash
pnpm uspec
```

### Individual Unit Spec File
```bash
pnpm uspec <filepath>
```
Example:
```bash
pnpm uspec spec/unit/controller/ok.spec.ts
```

### All Unit Specs in a Directory
```bash
pnpm uspec <dirpath>
```
Example:
```bash
pnpm uspec spec/unit/controller/
```

### Individual Spec Example in a Unit Spec File
**Note:** Requires `allowOnly: true,` to be temporarily added to `spec/unit/vite.config.ts`

Add `.only` to a spec example:
```typescript
it.only('renders the data as json', () => {
  // test code
});
```

## Running Feature Specs

**Important:** Feature specs should only be run when explicitly instructed to do so by the user.

### All Feature Specs
```bash
pnpm fspec
```

### Individual Feature Spec File
```bash
pnpm fspec <filepath>
```
Example:
```bash
pnpm fspec spec/features/temporary-second-feature-spec.spec.ts
```

### All Feature Specs in a Directory
```bash
pnpm fspec <dirpath>
```
Example:
```bash
pnpm fspec spec/features/
```

### Individual Spec Example in a Feature Spec File
**Note:** Requires `allowOnly: true,` to be temporarily added to `spec/features/vite.config.ts`

Add `.only` to a spec example:
```typescript
it.only('can run multiple feature specs', async () => {
  // test code
});
```
