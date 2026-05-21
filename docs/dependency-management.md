# Dependency Management

This repo uses two pnpm features to keep dependencies consistent across packages:

- **`catalog:`** — shared versions of external packages (e.g. `typescript`, `vite`) defined once in `pnpm-workspace.yaml`
- **`workspace:*`** — references to other packages in this repo (e.g. `@horizon/config`)

---

## The catalog

Shared dev tooling versions live in `pnpm-workspace.yaml`:

```yaml
catalog:
  typescript: ^5.8.3
  tsup: ^8.5.0
  vite: ^6.3.5
  vitest: ^2.0.0
  rimraf: ^6.0.1
  '@changesets/cli': ^2.27.12
```

A package opts in by writing `"catalog:"` as the version in its `package.json`:

```json
"devDependencies": {
  "typescript": "catalog:",
  "tsup": "catalog:"
}
```

---

## Common tasks

### Upgrade a shared dependency

Edit the version in `pnpm-workspace.yaml`, then reinstall:

```sh
# 1. Edit pnpm-workspace.yaml — bump the version, e.g. typescript: ^5.9.0
# 2. Reinstall
pnpm install
```

Every package using `"catalog:"` for that dep picks up the new version automatically.

### Add a new shared dependency (used by multiple packages)

1. Add it to the catalog in `pnpm-workspace.yaml`:

```yaml
catalog:
  prettier: ^3.3.0   # ← new entry
```

2. Reference it from whichever packages need it:

```json
"devDependencies": {
  "prettier": "catalog:"
}
```

3. Install:

```sh
pnpm install
```

### Add a package-specific dependency (not shared)

If only one package needs it, skip the catalog and add a normal version directly to that package's `package.json`:

```json
"dependencies": {
  "@azure/app-configuration": "^1.7.0"
}
```

Then run `pnpm install` from the repo root.

Alternatively, use the CLI to add it directly:

```sh
pnpm --filter @horizon/config-exporter add some-package
```

### Reference another package in this repo

Use `workspace:*` as the version. For example, to use `@horizon/config` inside `@horizon/vite-plugin`:

```json
"devDependencies": {
  "@horizon/config": "workspace:*"
}
```

Then run `pnpm install` from the repo root. pnpm will symlink the local package rather than downloading it from the registry.

> `workspace:*` means "use whatever version is locally checked out." When a package is published, pnpm replaces this with the actual version number (e.g. `"^0.1.0"`).

### Remove a dependency

```sh
# From a specific package
pnpm --filter @horizon/vite-plugin remove some-package

# If it was the last package using a catalog entry, also remove it from pnpm-workspace.yaml
```

---

## Running commands across packages

```sh
# Install all dependencies (always run from repo root)
pnpm install

# Build all packages
pnpm -r build

# Build a specific package
pnpm --filter @horizon/config build

# Run tests across all packages
pnpm -r test
```

---

## What happens when packages are published

Before publishing, pnpm rewrites version specifiers in `package.json`:

| In source | Published as |
|---|---|
| `"workspace:*"` | `"^0.1.0"` (the current version of that package) |
| `"catalog:"` | `"^5.8.3"` (the resolved version from the catalog) |

Consumers installing from the registry will never see `workspace:` or `catalog:` — they get normal semver ranges. This is handled automatically by Changesets + pnpm during the release process.
