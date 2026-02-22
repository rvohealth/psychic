# AGENTS.md - AI Agent Instructions

This file provides instructions for AI agents working on this project.

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
