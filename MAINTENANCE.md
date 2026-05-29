# Maintenance

## Releasing

Interactive release:

```bash
pnpm release
```

`pnpm release` opens an interactive prompt where you can choose patch, minor, major, next, conventional, prerelease, or a custom version.

Non-interactive examples:

```bash
pnpm exec bumpp --release patch -y
pnpm exec bumpp --release minor -y
pnpm exec bumpp --release major -y
```

Exact version:

```bash
pnpm exec bumpp --release 2.14.0
```

The release command is defined in [`package.json`](./package.json) and uses [`bumpp`](https://www.npmjs.com/package/bumpp) with shared settings in [`bump.config.mjs`](./bump.config.mjs).

It will:

1. Bump both package versions.
2. Run `pnpm test`.
3. Create commit `vX.Y.Z`.
4. Create tag `vX.Y.Z`.
5. Push the commit and tag to `origin`.

## One-Time Setup For npm Trusted Publishing

Both packages need to trust the GitHub Actions workflow in this repository:

```bash
npm trust github launch-editor --repo vitejs/launch-editor --file publish.yml
npm trust github launch-editor-middleware --repo vitejs/launch-editor --file publish.yml
```

This only needs to be done once per package unless the workflow file is renamed or the publishing setup changes.

## How Publishing Works

Publishing is handled by [`publish.yml`](./.github/workflows/publish.yml).

When a tag like `v2.13.3` is pushed, GitHub Actions will:

1. Install dependencies with pnpm.
2. Run the test suite.
3. Publish the workspace packages with `pnpm -r publish --access public --provenance --no-git-checks`.

`pnpm -r publish` runs in topological order, so `launch-editor` is published before `launch-editor-middleware`.

## Useful Commands

Add `--no-push` to keep any release command local:

```bash
pnpm release --no-push
pnpm exec bumpp --release minor -y --no-push
```

Check the current workspace tests:

```bash
pnpm test
```

## Troubleshooting

If `pnpm release` fails:

- Make sure your git working tree is clean enough for `bumpp` to commit and tag.
- Make sure your local branch is up to date before releasing.
- If commit or tag signing is enabled in your git config, make sure the signing agent is available.

If the GitHub Actions publish job fails:

- Confirm both npm packages still trust `publish.yml`.
- Confirm the npm package names are still `launch-editor` and `launch-editor-middleware`.

## Files

- [`package.json`](./package.json)
- [`bump.config.mjs`](./bump.config.mjs)
- [`.github/workflows/publish.yml`](./.github/workflows/publish.yml)
