# claws-supply CLI (`packages/cli`)

Landing page: [claws.supply](https://claws.supply)

CLI for creating, packaging, and publishing template artifacts to claws.supply.

## Use the CLI (from npm)

Run directly with `npx`:

```bash
npx claws-supply@latest --help
npx claws-supply@latest auth
npx claws-supply@latest build
npx claws-supply@latest publish
npx claws-supply@latest use <template-slug>
```

Commands:

- `claws-supply auth` — authenticate with device authorization
- `claws-supply logout` — clear local auth state
- `claws-supply build` — build and sign a local template artifact
- `claws-supply publish` — upload and publish latest artifact as draft
- `claws-supply use <template-slug>` — download and apply a template to `./.openclaw/workspace`

## Default Source Behavior

`build` targets your current folder by default:

```bash
npx claws-supply@latest build
```

Use `--source <path>` only when the target project is elsewhere:

```bash
npx claws-supply@latest build --source /path/to/target
```

`--source .` is optional and equivalent to the default current folder behavior.

## Local API vs Production

- Default target: `https://claws.supply`
- Local target: pass `-D` to use `http://localhost:3039`

Examples:

```bash
npx claws-supply@latest auth -D
npx claws-supply@latest build -D
npx claws-supply@latest publish -D
```

## Local Development (this repo)

```bash
cd /Users/anthonyriera/code/hourglass
bun install
cd packages/cli
bun run build
bun run test
bun run smoke:local
```

Run built CLI directly:

```bash
node dist/index.js auth -D
node dist/index.js build -D
node dist/index.js publish -D
```

## Test CLI in Another Folder

Option A: run built binary by absolute path.

```bash
cd /path/to/another/project
node /Users/anthonyriera/code/hourglass/packages/cli/dist/index.js build -D
node /Users/anthonyriera/code/hourglass/packages/cli/dist/index.js publish -D
```

Option B: install tarball (publish-like test).

```bash
cd /Users/anthonyriera/code/hourglass/packages/cli
bun run build
npm pack
cd /path/to/another/project
npm install -D /Users/anthonyriera/code/hourglass/packages/cli/claws-supply-0.1.0.tgz
npx claws-supply@latest build -D
npx claws-supply@latest publish -D
```

Option C: global link for fast iteration.

```bash
cd /Users/anthonyriera/code/hourglass/packages/cli
npm link
cd /path/to/another/project
claws-supply build -D
claws-supply publish -D
```

## Auth and Artifact State

- Auth state: `~/.config/claws-supply/auth.json` (or `$XDG_CONFIG_HOME/claws-supply/auth.json`)
- Build output: `./.claws-supply/builds/<slug>/v1/`
- Latest pointer: `./.claws-supply/latest-build.json`

## Clean Reset

```bash
claws-supply logout
rm -rf .claws-supply
```

## Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| `401 Unauthorized` | Expired or invalid token | Re-run `claws-supply auth` |
| `409 slug already in use` | Slug conflict | Pick a different slug and rebuild |
| `422` publish validation error | Manifest/title/slug mismatch or artifact integrity issue | Re-run `build`, then `publish` |
| `429 Too many requests` | API rate limit | Wait and retry |
| Upload token errors | Missing web env config | Ensure `apps/web/.env.local` includes `PRIVATE_READ_WRITE_TOKEN` |
