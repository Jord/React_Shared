# React Shared Horizon

React_Shared is the main dependency for Horizon React Projects.

## Packages

* [`@horizon/config`](packages/config) - Runtime configuration management for Horizon React apps
* [`@horizon/vite-plugin`](packages/vite-plugin) - Shared Vite plugin for development tooling
* [`@horizon/config-exporter`](packages/config-exporter) - CLI tool to export Azure App Configuration to a config file

## Making changes

Each package is versioned independently using [Changesets](https://github.com/changesets/changesets). The workflow for making and publishing a change is:

### 1. Make your code changes

Edit the relevant package(s) under `packages/`. Run `pnpm dev` from the root to watch and rebuild all packages during development.

### 2. Add a changeset

Once your changes are ready, run:

```bash
pnpm changeset
```

This opens an interactive prompt where you:
- Select which packages were changed
- Choose the bump type for each — `patch` (bug fix), `minor` (new feature), or `major` (breaking change)
- Write a short description of what changed

This creates a file in `.changeset/` that should be committed alongside your code changes.

> If your change doesn't affect any published package (e.g. a docs update or tooling change), you can skip this step.

### 3. Open a pull request

Commit your code changes and the generated `.changeset/` file together and open a PR targeting `main`. Tests run automatically on the PR.

### 4. Version and publish (on merge to main)

After merging, apply the pending changesets to bump package versions and update changelogs:

```bash
pnpm version-packages
```

Then publish to Azure Artifacts:

```bash
pnpm publish-packages
```

`publish-packages` builds all packages before publishing. Commit the version bumps afterwards.

> Note: you must be authenticated to the Azure Artifacts feed to publish. See your `.npmrc` for the registry URL.

---

## Testing

This repo uses [Vitest](https://vitest.dev) with a workspace config so all packages are tested from the root.

### Running tests

```bash
# Watch mode — all packages (development)
pnpm test

# Single run — all packages (CI)
pnpm vitest run

# Watch mode — single package
cd packages/vite-plugin
pnpm test
```

### Adding tests to a package

Test files go in `test/` inside the package directory (e.g. `packages/vite-plugin/test/my-feature.test.ts`).

### Adding a new package to the test workspace

1. Add the package path to `pnpm-workspace.yaml` under `packages:`
2. Add the package path to `vitest.workspace.ts`
3. Create a `vitest.config.ts` in the package — use `environment: 'node'` for non-browser packages, `environment: 'jsdom'` for React component packages